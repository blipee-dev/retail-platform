import os
import sys
import aiogram
import logging
import asyncio
from datetime import datetime, timedelta
from aiogram import Bot, Dispatcher, types
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, BotCommand
import json
import random
import string
import matplotlib.pyplot as plt
import re
import io
from typing import Union
from aiogram.utils.exceptions import MessageNotModified, InvalidQueryID, TelegramAPIError
from aiogram import types
from aiogram import executor
from aiogram.dispatcher.filters.state import State, StatesGroup
from aiogram.dispatcher import FSMContext
from aiogram.contrib.middlewares.logging import LoggingMiddleware
from aiogram.contrib.fsm_storage.memory import MemoryStorage
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton
from sqlalchemy import Float, create_engine, func, Column, Integer, String, DateTime, distinct
from sqlalchemy.orm import declarative_base, sessionmaker
import pandas as pd

# Adiciona o diretório principal ao sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from core.config import TELEGRAM_TOKEN_TEST, stores, DATABASE_URL, itens_desconsiderados
from core.models import LastUpdate
from core.analytics_4 import (
    comparar_periodo_anterior, obter_datas, mostrar_resultados,
    mostrar_resultados_percentual, mostrar_resultados_minutos,
    mostrar_resultados_unidades, mostrar_resultados_devolucoes,
    mostrar_resultados_descontos, calcular_diferenca,
    calcular_percentagem_ocupacao, calcular_top_2_regioes_ocupadas,
    calcular_menos_2_regioes_ocupadas, obter_datas_comparacao, mostrar_resultados_ocupacao
)
from conector.space_heatmap import generate_heatmap
from core.feedback_3 import start_feedback, handle_text_response, process_feedback, FeedbackStates
from tasks import processar_dados_pesados

# Função de escape personalizada para o Markdown V2
def escape_md(text):
    escape_chars = r'\_[]()~>#+-=|{}.!'
    return re.sub(f'([{re.escape(escape_chars)}])', r'\\\1', text)

# Configuração do logger com timestamp
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
logger = logging.getLogger(__name__)

# Configuração do banco de dados
DATABASE_URL = 'sqlite:///c:/projetos/grnl_platform/bot_database.db'
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
Base = declarative_base()

# Variáveis globais para gerenciar timeouts
interaction_timeouts = {}

async def cancel_interaction(chat_id):
    if chat_id in user_states:
        del user_states[chat_id]
    if chat_id in interaction_timeouts:
        interaction_timeouts[chat_id].cancel()
        del interaction_timeouts[chat_id]

    # Tenta remover teclados interativos de mensagens anteriores
    try:
        last_message = await bot.send_message(chat_id, "⚠️ A sessão foi encerrada devido a inatividade. Quando quiser retomar, use /start para reiniciar.")
        if last_message:
            await bot.edit_message_reply_markup(chat_id, last_message.message_id, reply_markup=None)
    except Exception as e:
        logger.warning(f"Falha ao remover o teclado interativo: {e}")

# Função para definir o timeout de interação
async def set_interaction_timeout(chat_id, timeout_seconds=300):
    if chat_id in interaction_timeouts:
        interaction_timeouts[chat_id].cancel()  # Cancelar timeout anterior, se houver
    interaction_timeouts[chat_id] = asyncio.create_task(asyncio.sleep(timeout_seconds))
    await interaction_timeouts[chat_id]
    await cancel_interaction(chat_id)  # Limpeza do estado ao expirar o timeout

# Função para concluir a interação
async def concluir_interacao(chat_id):
    if chat_id in interaction_timeouts:
        interaction_timeouts[chat_id].cancel()
        del interaction_timeouts[chat_id]
    if chat_id in user_states:
        del user_states[chat_id]
    await bot.send_message(chat_id, "✅ Interação concluída com êxito.")

# Função para processar tarefas pesadas com Celery
async def handle_heavy_task(message: types.Message):
    print("Recebi o comando /start_heavy_task")
    await bot.send_message(chat_id=message.chat.id, text="A tarefa foi iniciada! Será notificado assim que estiver concluída.")
    
    # Disparar uma tarefa pesada para Celery
    result = processar_dados_pesados.apply_async(args=['param1', 'param2'])
    print(f"Tarefa disparada para Celery com ID: {result.id}")
    
    # Verificar o resultado da tarefa mais tarde
    while not result.ready():
        print("Esperando tarefa concluir...")
        await asyncio.sleep(1)
    
    result_value = result.get()
    print(f"Tarefa concluída com resultado: {result_value}")
    await bot.send_message(chat_id=message.chat.id, text=f"Tarefa concluída! Resultado: {result_value}")

class PeopleCountingData(Base):
    __tablename__ = 'people_counting_data'
    id = Column(Integer, primary_key=True)
    loja = Column(String)
    ip = Column(String)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    total_in = Column(Integer)
    line1_in = Column(Integer)
    line2_in = Column(Integer)
    line3_in = Column(Integer)
    line4_in = Column(Integer)
    line4_out = Column(Integer)  # Adicionando line4_out

class SaleData(Base):
    __tablename__ = 'sales_data'
    id = Column(Integer, primary_key=True, autoincrement=True)
    loja = Column(String, nullable=False)
    data = Column(DateTime, nullable=False)
    codigo = Column(String, nullable=False)
    referencia_documento = Column(String, nullable=False)
    documento_original = Column(String, nullable=True)
    tipo_documento = Column(String, nullable=False)
    hora = Column(String, nullable=False)
    vendedor_codigo = Column(String, nullable=False)
    vendedor_nome_curto = Column(String, nullable=False)
    item = Column(String, nullable=False)
    descritivo = Column(String, nullable=False)
    quantidade = Column(Float, nullable=False)
    valor_venda_com_iva = Column(Float, nullable=False)
    valor_venda_sem_iva = Column(Float, nullable=False)
    iva = Column(Float, nullable=False)
    desconto = Column(Float, nullable=False)
    percentual_desconto = Column(Float, nullable=False)
    motivo_desconto = Column(String, nullable=True)

class RegistroStates(StatesGroup):
    esperando_codigo_convite = State()

# Variáveis Globais e Inicialização de Arquivos
PERIODOS = ["Hoje", "Ontem", "Esta Semana", "Este Mês", "Customizado"]
CHAT_ID_FILE = 'last_chat_id.txt'
USER_DATA_FILE = 'user_data.json'
INVITES_FILE = 'invites.json'
ALTERATION_CODES_FILE = 'alteration_codes.json'
SUPER_ADMIN_FILE = 'super_admin.json'

user_states = {}
user_data = {}
invites = {}
alteration_codes = {}
super_admin = {}

def initialize_json_file(file_path, default_content):
    if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
        try:
            with open(file_path, 'w') as file:
                json.dump(default_content, file, indent=4)
            logger.info(f"Arquivo {file_path} inicializado com conteúdo padrão.")
        except Exception as e:
            logger.error(f"Erro ao inicializar arquivo {file_path}: {str(e)}")

# Carregar e salvar dados de arquivos JSON
def load_json(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    return {}

def save_json(file_path, data):
    try:
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=4)
        logger.info(f"Dados salvos com sucesso em {file_path}.")
    except Exception as e:
        logger.error(f"Erro ao salvar dados em {file_path}: {str(e)}", exc_info=True)

# Função para carregar os dados de cada arquivo
def load_user_data():
    global user_data
    user_data = load_json(USER_DATA_FILE)
    logger.info("Dados de usuários carregados com sucesso.")

def load_invites():
    global invites
    invites = load_json(INVITES_FILE)
    logger.info("Convites carregados com sucesso.")

def load_alteration_codes():
    global alteration_codes
    alteration_codes = load_json(ALTERATION_CODES_FILE)
    logger.info("Códigos de alteração carregados com sucesso.")

def load_super_admin():
    global super_admin
    super_admin = load_json(SUPER_ADMIN_FILE)
    if not super_admin:
        super_admin = {"chat_id": "", "username": ""}

# Função para salvar dados em cada arquivo
def save_user_data():
    save_json(USER_DATA_FILE, user_data)

# Adicionar a função de atualização aqui
def atualizar_dados_usuario(chat_id, chave, valor):
    user_data[str(chat_id)][chave] = valor
    save_user_data()
    logger.info(f"Dados do usuário {chat_id} atualizados: {chave} = {valor}")

def save_invites():
    save_json(INVITES_FILE, invites)

def save_alteration_codes():
    save_json(ALTERATION_CODES_FILE, alteration_codes)

def save_super_admin(admin_data):
    save_json(SUPER_ADMIN_FILE, admin_data)

# Inicializar arquivos JSON ao iniciar o bot
initialize_json_file(USER_DATA_FILE, {})
initialize_json_file(INVITES_FILE, {})
initialize_json_file(ALTERATION_CODES_FILE, {})
initialize_json_file(SUPER_ADMIN_FILE, {"chat_id": "", "username": ""})

# Carregar dados dos arquivos
load_user_data()
load_invites()
load_alteration_codes()
load_super_admin()

# Atualizar estrutura de dados de usuários se necessário
for user_id, data in user_data.items():
    if 'update_notified' not in data:
        data['update_notified'] = False  # Adiciona a flag se não existir
save_user_data()

# Função para salvar e recuperar o último chat_id utilizado
def save_chat_id(chat_id):
    with open(CHAT_ID_FILE, 'w') as file:
        file.write(str(chat_id))

def get_last_chat_id():
    if os.path.exists(CHAT_ID_FILE):
        with open(CHAT_ID_FILE, 'r') as file:
            return file.read().strip()
    return None

# Função para gerar códigos aleatórios
def generate_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

# Função para recuperar informações do usuário
def get_user_info(message_or_call):
    if isinstance(message_or_call, types.Message):
        username = message_or_call.from_user.username if message_or_call.from_user.username else "N/A"
        chat_id = str(message_or_call.chat.id)
    elif isinstance(message_or_call, types.CallbackQuery):
        username = message_or_call.from_user.username if message_or_call.from_user.username else "N/A"
        chat_id = str(message_or_call.message.chat.id)

    # Verifica se o usuário está registrado
    user_info = user_data.get(chat_id, {})
    if not user_info:
        logger.warning(f"Usuário {chat_id} não encontrado no arquivo user_data.json.")
        return f"User: {username}, Chat ID: {chat_id}, Nível: Indefinido"

    # Prioridade para super_admin.json
    if chat_id == super_admin.get('chat_id'):
        nivel_acesso = super_admin.get('nivel_acesso', 'Super Admin')
        return f"User: {super_admin.get('username', username)}, Chat ID: {chat_id}, Nível: {nivel_acesso}"

    nivel_acesso = user_info.get('nivel_acesso', 'Indefinido')
    return f"User: {username}, Chat ID: {chat_id}, Nível: {nivel_acesso}"

def obter_datas(periodo):
    now = datetime.now()
    if periodo == "Hoje":
        inicio = datetime(now.year, now.month, now.day)
        fim = inicio + timedelta(days=1) - timedelta(seconds=1)
    elif periodo == "Ontem":
        fim = datetime(now.year, now.month, now.day) - timedelta(seconds=1)
        inicio = fim - timedelta(days=1) + timedelta(seconds=1)
    elif periodo == "Esta Semana":
        inicio = datetime(now.year, now.month, now.day) - timedelta(days=now.weekday())
        fim = inicio + timedelta(days=7) - timedelta(seconds=1)
    elif periodo == "Este Mês":
        inicio = datetime(now.year, now.month, 1)
        next_month = inicio.replace(day=28) + timedelta(days=4)
        fim = next_month - timedelta(days=next_month.day)
    else:
        raise ValueError(f"Período desconhecido: {periodo}")
    inicio_lp = inicio - timedelta(days=365)
    fim_lp = fim - timedelta(days=365)
    return inicio, fim, inicio_lp, fim_lp

# Funções para os Menus
async def mostrar_menu_inicial(message_or_call):
    try:
        # Verifica se o objeto é um CallbackQuery ou uma Message
        if isinstance(message_or_call, types.CallbackQuery):
            chat_id = message_or_call.message.chat.id
            message = message_or_call.message
            # Remove o markup da mensagem anterior
            try:
                await bot.edit_message_reply_markup(chat_id, message.message_id, reply_markup=None)
            except aiogram.utils.exceptions.MessageNotModified:
                logger.warning(f"Mensagem já estava sem markup: {message.message_id}")
        else:
            chat_id = message_or_call.chat.id
            message = message_or_call

        chat_id_str = str(chat_id)
        username = user_data.get(chat_id_str, {}).get('username', 'usuário')

        saudacao = f"👋 Olá, {username}! Bem-vindo(a) ao Assistente de Loja! Em que posso ajudar hoje?"

        # Cria o markup para o menu inicial
        markup = InlineKeyboardMarkup()
        markup.add(InlineKeyboardButton("🔍 Consultas", callback_data="menu_consultas"))
        markup.add(InlineKeyboardButton("⚙️ Definições", callback_data="menu_definicoes"))
        markup.add(InlineKeyboardButton("❓ Ajuda", callback_data="help"))

        # Envia a mensagem com o novo markup
        await message.answer(saudacao, reply_markup=markup)
    except Exception as e:
        logger.error(f"Erro ao mostrar o menu inicial: {str(e)}", exc_info=True)

    # Configura o timeout para essa interação
    await set_interaction_timeout(chat_id)

async def menu_consultas(call: types.CallbackQuery):
    chat_id = call.message.chat.id
    user_record = user_data.get(str(chat_id), super_admin)
    nivel_acesso = user_record['nivel_acesso']

    # Tenta remover o markup anterior, se existir
    try:
        if call.message.reply_markup is not None:
            await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
        else:
            logger.info(f"A mensagem {call.message.message_id} já não tem markup.")
    except aiogram.utils.exceptions.MessageNotModified:
        logger.warning(f"Mensagem {call.message.message_id} já estava sem markup ou não pôde ser modificada.")

    # Criação do novo markup
    markup = InlineKeyboardMarkup()
    if nivel_acesso in ["Super Admin", "Admin", "Gestor de Grupo", "Gestor de Loja", "Lojista", "Geral"]:
        markup.add(InlineKeyboardButton("Consultar Lojas", callback_data="consultar"))
    if nivel_acesso in ["Super Admin", "Admin", "Geral", "Gestor de Grupo"]:
        markup.add(InlineKeyboardButton("Consultar Grupo", callback_data="consultargrupo"))
    if nivel_acesso in ["Super Admin", "Admin", "Gestor de Grupo", "Gestor de Loja"]:
        markup.add(InlineKeyboardButton("Exportar dados", callback_data="exportardados"))
    markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))

    # Enviar a nova mensagem com opções
    await bot.send_message(chat_id, "🔍 Por favor, escolha uma das opções abaixo:", reply_markup=markup)
    await call.answer()

async def menu_definicoes(call: types.CallbackQuery):
    try:
        # Remove o markup da mensagem anterior
        try:
            await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
        except aiogram.utils.exceptions.MessageNotModified:
            logger.warning(f"Mensagem já estava sem markup: {call.message.message_id}")

        # Responde ao callback query para remover a "spinning wheel"
        await call.answer()

        # Obtém o chat ID e os dados do usuário
        chat_id = call.message.chat.id
        user_record = user_data.get(str(chat_id), super_admin)
        nivel_acesso = user_record.get('nivel_acesso', 'Geral')  # Usando 'Geral' como padrão

        # Cria o markup do menu de definições
        markup = InlineKeyboardMarkup()

        # Opções para Super Admin e Admin
        if nivel_acesso in ["Super Admin", "Admin"]:
            markup.add(InlineKeyboardButton("Listar Utilizadores", callback_data="listarusuarios"))
            markup.add(InlineKeyboardButton("Gerar Convite", callback_data="gerarconvite"))
            markup.add(InlineKeyboardButton("Alterar Permissões", callback_data="alterarnivel"))
            markup.add(InlineKeyboardButton("Remover Utilizador", callback_data="apagarutilizador"))
       
        # Opção disponível para todos
        markup.add(InlineKeyboardButton("Registar", callback_data="registo"))
        markup.add(InlineKeyboardButton("Alterar Minhas Permissões", callback_data="usarcodigo"))
        markup.add(InlineKeyboardButton("Listar Funções", callback_data="funcoes"))
        markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
                
        # Envia a mensagem com as opções
        await bot.send_message(chat_id=call.message.chat.id, text="⚙️ Selecione uma opção:", reply_markup=markup)

    except Exception as e:
        logger.error(f"Erro ao exibir o menu de definições: {str(e)}")
        await bot.send_message(chat_id=call.message.chat.id, text=f"Erro ao exibir o menu de definições: {str(e)}")

# Função para cancelar o estado de feedback
async def cancelar_feedback(chat_id):
    if chat_id in user_states and user_states[chat_id].get('step') == 'feedback':
        del user_states[chat_id]  # Cancela o estado de feedback
        logger.info(f"Feedback cancelado para o usuário {chat_id}.")

# Funções de Handler de Mensagem
async def send_welcome(message: types.Message):
    chat_id = str(message.chat.id)
    nome_utilizador = message.from_user.first_name if message.from_user.first_name else "Utilizador"

    # Verificar e cancelar estados de feedback ativos
    await cancelar_feedback(chat_id)

    # Verifica se o utilizador já está registado no user_data.json
    if chat_id not in user_data:
        # Iniciar automaticamente o processo de registro
        await bot.send_message(chat_id, f"🔑 Bem-vindo(a), {nome_utilizador}! Parece que você ainda não está registado(a). ...")
        await registo(message)  # Chama a função de registro diretamente
        return  # O processo de registro será tratado pela função iniciar_registo

    # Se o utilizador já está registado, verifica se precisa notificar sobre as atualizações
    if not user_data[chat_id].get('update_notified', False):
        # Enviar a mensagem de atualização
        update_message = escape_md("""
📢 **📢 Olá! Temos novidades! A nossa aplicação de vendas foi atualizada para a versão 2.0 🚀**

Estamos super entusiasmados em compartilhar as novidades desta atualização consigo! 😊 Aqui está um pequeno resumo das principais melhorias que preparamos especialmente para si:

Novo Comando /consultargrupo: Agora pode consultar os dados agregados por grupo de lojas, obtendo uma visão completa e detalhada de todas as métricas importantes.

Menus Interativos Aprimorados: Simplificámos a navegação para tornar a sua experiência ainda mais fluida! Agora, os menus interativos estão mais intuitivos, facilitando a escolha entre "Consultas", "Definições", "Ajuda" e mais.

Novo Comando /usarcodigo: Precisa de alterar o seu nível de acesso? Fácil! Agora pode usar um código gerado por um administrador para fazer isso diretamente pelo bot.

Exportação de Dados Simplificada: Melhorámos o processo de exportação de dados para Excel, tornando-o mais rápido e preciso – tudo para facilitar o seu trabalho!

Funcionalidades de Gestão Melhoradas: Gerir utilizadores nunca foi tão fácil! Agora pode listar utilizadores, gerar convites, alterar permissões e até remover utilizadores diretamente pelo bot.

Interface Renovada: Com um design mais limpo e intuitivo, aceder às informações que precisa ficou mais simples e agradável.

Estamos sempre a pensar em formas de melhorar a sua experiência. Se precisar de ajuda ou quiser explorar mais sobre as novas funcionalidades, basta usar o comando /help ou /funcoes. Estamos aqui para ajudar!

Esperamos que aproveite as novidades e, como sempre, boas vendas! 🎉

Estamos sempre a procurar melhorar a experiência dos nossos utilizadores. Se precisar de ajuda ou quiser explorar mais sobre as novas funcionalidades, utilize o comando `/help` ou `/funcoes`.

Aproveite as novidades e boas vendas! 🎉
        """)
        await message.answer(update_message, parse_mode='MarkdownV2')

        # Atualizar a flag para evitar futuras notificações
        user_data[chat_id]['update_notified'] = True
        save_user_data()

    # Mostrar o menu inicial após a mensagem de atualização
    await mostrar_menu_inicial(message)
    logger.info(f"Comando /start recebido de {get_user_info(message)}")

async def send_help(message: types.Message):
    try:
        help_text = """
🆘 **Como Utilizar a Nossa Aplicação**

Se precisar de começar de novo a qualquer momento, basta usar o comando /start. E se quiser ver estas instruções com mais detalhes, é só digitar /help.

🔍 Fazendo Consultas

Consultar Grupo: Consulte informações sobre um grupo de lojas, ideal para uma visão consolidada.
Consultar Lojas: Obtenha dados específicos de uma loja, ajustados às suas necessidades.
Exportar Dados: Exporte as informações que precisa em formato Excel, de forma simples.


⚙️ Definições e Gestão

Listar Utilizadores: Veja todos os utilizadores registados na nossa plataforma.
Gerar Convite: Convide novos utilizadores de forma fácil e rápida.
Alterar Permissões: Ajuste o nível de acesso dos utilizadores conforme necessário.
Remover Utilizador: Remova alguém diretamente aqui, se necessário.
Registar: Junte-se ao sistema com um código de convite que já tenha.
Alterar Minhas Permissões: Mude o seu nível de acesso utilizando um código especial.
Exportar Dados: Exporte as informações que precisa em formato Excel, de forma simples.

📊 Entendendo os Indicadores

Taxa de Conversão: A percentagem de visitas que resultaram em vendas.
Total de Vendas (s/ IVA): O total de vendas sem incluir impostos.
Total de Vendas (c/ IVA): O total de vendas já com impostos incluídos.
Transações: O número total de vendas realizadas.
Visitantes: O número de pessoas que entraram na loja.
Ticket Médio (s/ IVA): O valor médio das vendas, sem impostos.
Ticket Médio (c/ IVA): O valor médio das vendas, com impostos.
Unidades por Transação: A média de unidades vendidas em cada transação.
Tempo Médio de Permanência: O tempo médio que os clientes passam na loja.
Número de Passagens: A quantidade de vezes que as pessoas passaram em frente à loja.
Entry Rate: A percentagem de visitantes em relação ao número de passagens pela loja.
Índice de Devoluções: A percentagem do valor devolvido em relação às vendas.
Índice de Descontos: A percentagem do valor descontado em relação às vendas.

🏅 Top Vendedores

Top Vendedores: Conheça os vendedores com o maior volume de vendas (sem IVA).
Como é calculado: A soma do valor das vendas de cada vendedor determina os melhores desempenhos.

🛒 Top Produtos 

Top Produtos: Veja os produtos mais vendidos em quantidade.
Como é calculado: Os produtos são ordenados pelo número de unidades vendidas, destacando os preferidos pelos clientes.

📉 Variações

As variações mostram como o desempenho atual se compara com o período anterior correspondente. A variação percentual é calculada assim: ((valor atual - valor anterior) / valor anterior) * 100.
        """
        # Criar o teclado com o botão "Sair"
        markup = InlineKeyboardMarkup()
        markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))

        # Enviar a mensagem com o teclado
        await bot.send_message(chat_id=message.chat.id, text=help_text, reply_markup=markup)
        logger.info(f"Comando /help recebido de {message.from_user.id}")
    except Exception as e:
        logger.error(f"Erro ao enviar mensagem de ajuda: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=message.chat.id, text=f"Erro ao enviar mensagem de ajuda: {str(e)}")
        
async def listar_funcoes(call_or_message: Union[types.CallbackQuery, types.Message]):
    try:
        chat_id = call_or_message.message.chat.id if isinstance(call_or_message, types.CallbackQuery) else call_or_message.chat.id
        user_info = user_data.get(str(chat_id), super_admin)
        nome_utilizador = call_or_message.from_user.first_name if call_or_message.from_user.first_name else "Utilizador"

        nivel_acesso = user_info.get('nivel_acesso', 'Indefinido')

        comandos = {
            "Super Admin": ["/consultar", "/consultargrupo", "/gerarconvite", "/apagarutilizador", "/listarusuarios", "/alterarnivel", "/help", "/funcoes", "/usarcodigo", "/exportardados", "/feedback"],
            "Admin": ["/consultar", "/consultargrupo", "/gerarconvite", "/apagarutilizador", "/listarusuarios", "/alterarnivel", "/help", "/funcoes", "/usarcodigo", "/exportardados", "/feedback"],
            "Geral": ["/consultar", "/consultargrupo", "/help", "/funcoes", "/usarcodigo", "/feedback"],
            "Gestor de Grupo": ["/consultar", "/consultargrupo", "/gerarconvite", "/listarusuarios", "/alterarnivel", "/help", "/funcoes", "/usarcodigo", "/exportardados", "/feedback"],
            "Gestor de Loja": ["/consultar", "/gerarconvite", "/listarusuarios", "/alterarnivel", "/help", "/funcoes", "/usarcodigo", "/exportardados", "/feedback"],
            "Lojista": ["/consultar", "/help", "/funcoes", "/usarcodigo", "/feedback"]
        }

        comandos_usuario = comandos.get(nivel_acesso, ["/help"])

        resposta = f"📜 Aqui estão os comandos disponíveis para si, {nome_utilizador}:\n"
        for comando in comandos_usuario:
            resposta += f"{comando}\n"

        # Remove o markup anterior, se for callback
        if isinstance(call_or_message, types.CallbackQuery):
            await bot.edit_message_reply_markup(call_or_message.message.chat.id, call_or_message.message.message_id, reply_markup=None)

        markup = InlineKeyboardMarkup()
        markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))

        # Usa bot.send_message para enviar a mensagem com o markup
        await bot.send_message(chat_id, resposta, reply_markup=markup)

    except Exception as e:
        logger.error(f"Erro ao listar funções: {str(e)}", exc_info=True)
        await bot.send_message(chat_id, f"Erro ao listar funções: {str(e)}")

async def registo(call_or_message: Union[types.CallbackQuery, types.Message]):
    try:
        chat_id = call_or_message.message.chat.id if isinstance(call_or_message, types.CallbackQuery) else call_or_message.chat.id
        nome_utilizador = call_or_message.from_user.first_name if call_or_message.from_user.first_name else "Utilizador"

        # Remove o markup anterior, se for callback
        if isinstance(call_or_message, types.CallbackQuery):
            await bot.edit_message_reply_markup(call_or_message.message.chat.id, call_or_message.message.message_id, reply_markup=None)

        if str(chat_id) in user_data:
            await bot.send_message(chat_id=chat_id, text=f"✅ Olá {nome_utilizador}, você já está registado! Utilize /start para começar ou /help para ver as instruções.")
            return

        user_states[chat_id] = {'step': 'codigo_convite'}
        await bot.send_message(chat_id=chat_id, text="🔑 Insira o código de convite, por favor:")

    except Exception as e:
        logger.error(f"Erro ao iniciar registro: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=chat_id, text=f"Erro ao iniciar registro: {str(e)}")

# Função para processar o código de convite
async def processar_codigo_convite(message: types.Message):
    chat_id = message.chat.id

    # Verificar se o usuário está no estado correto para processar o registro
    if chat_id in user_states and user_states[chat_id].get('step') == 'codigo_convite':
        codigo_convite = message.text.strip()

        # Verificar se o código de convite existe no dicionário de convites
        if codigo_convite in invites:
            nivel_acesso = invites[codigo_convite]['nivel_acesso']
            grupo = invites[codigo_convite]['grupo']
            loja = invites[codigo_convite].get('loja', 'Todas')  # Loja pode ser opcional

            # Adicionar o usuário ao user_data com o nível de acesso e grupo
            user_data[str(chat_id)] = {
                "nivel_acesso": nivel_acesso,  # Nível de Acesso vindo do convite
                "grupo": grupo,                # Grupo vindo do convite
                "loja": loja,                  # Loja vinda do convite ou "Todas"
                "username": message.from_user.first_name or "Utilizador",
                "update_notified": False,      # Inicialmente false
                "saiu": False                  # Inicialmente false
            }
            save_user_data()

            # Remover o convite após o uso
            del invites[codigo_convite]
            save_invites()

            # Remover o estado após concluir o registro
            if chat_id in user_states:
                del user_states[chat_id]

            # Informar o usuário do sucesso do registro
            await bot.send_message(chat_id, f"🎉 Bem-vindo(a), {message.from_user.first_name}! Você foi registrado(a) como {nivel_acesso} no grupo {grupo}. Use /start para iniciar a aplicação.")
        else:
            # Caso o código não seja válido
            await bot.send_message(chat_id, "🚫 Código de convite inválido ou já utilizado.")
    else:
        await bot.send_message(chat_id, "❌ Você não está no processo de registro. Utilize /start para iniciar o registro novamente.")

# Função para gerar convite
async def gerar_convite(call_or_message: Union[types.CallbackQuery, types.Message]):
    try:
        # Verifica se é uma mensagem ou um callback
        if isinstance(call_or_message, types.CallbackQuery):
            chat_id = call_or_message.message.chat.id
            nome_utilizador = call_or_message.from_user.first_name if call_or_message.from_user.first_name else "Utilizador"
        else:
            chat_id = call_or_message.chat.id
            nome_utilizador = call_or_message.from_user.first_name if call_or_message.from_user.first_name else "Utilizador"

        # Verifica se o chat_id está no user_data ou se o usuário é super_admin
        if str(chat_id) not in user_data and str(chat_id) != str(super_admin.get("chat_id")):
            await call_or_message.answer("🚫 Apenas Super Admins, Admins e gestores podem gerar convites.")
            return

        user_info = user_data.get(str(chat_id), super_admin)
        nivel_acesso_usuario = user_info.get('nivel_acesso', 'Indefinido')

        # Define os níveis de acesso baseados no nível de acesso do usuário
        if nivel_acesso_usuario == 'Super Admin':
            niveis_acesso = ["Admin", "Geral", "Gestor de Grupo", "Gestor de Loja", "Lojista"]
        elif nivel_acesso_usuario == 'Admin':
            niveis_acesso = ["Geral", "Gestor de Grupo", "Gestor de Loja", "Lojista"]
        elif nivel_acesso_usuario == 'Gestor de Grupo':
            niveis_acesso = ["Gestor de Loja", "Lojista"]
        elif nivel_acesso_usuario == 'Gestor de Loja':
            niveis_acesso = ["Lojista"]
        else:
            await call_or_message.answer("🚫 Você não tem permissão para gerar convites.")
            return

        # Remove o markup anterior se for um callback
        if isinstance(call_or_message, types.CallbackQuery):
            await bot.edit_message_reply_markup(call_or_message.message.chat.id, call_or_message.message.message_id, reply_markup=None)

        # Inicializa o estado do usuário
        user_states[chat_id] = {'step': 'nivel_acesso_convite'}

        # Salva o nível de acesso atualizado no user_data
        user_data[str(chat_id)]['nivel_acesso'] = nivel_acesso_usuario
        save_user_data()

        # Criação do menu de seleção de nível de acesso
        markup = InlineKeyboardMarkup()
        for nivel in niveis_acesso:
            markup.add(InlineKeyboardButton(nivel, callback_data=f"nivel_acesso_convite:{nivel}"))
        markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))

        # Usa bot.send_message para enviar a mensagem com o markup
        await bot.send_message(chat_id, "📜 Escolha o nível de acesso para o convite:", reply_markup=markup)

    except Exception as e:
        logger.error(f"Erro ao gerar convite: {str(e)}", exc_info=True)
        await bot.send_message(chat_id, f"Erro ao gerar convite: {str(e)}")

async def processar_nivel_acesso_convite(call: types.CallbackQuery):
    try:
        # Definir o chat_id a partir de call.message ou call.from_user
        chat_id = call.message.chat.id if call.message else call.from_user.id
        nivel_acesso = call.data.split(":")[1]  # Extrair o nível de acesso dos dados do callback
        user_states[chat_id] = {'step': 'grupo_convite', 'nivel_acesso': nivel_acesso}
        user_info = user_data.get(str(chat_id), super_admin)

        # Informar ao usuário o nível de acesso selecionado
        await bot.send_message(chat_id=chat_id, text=f"Nível de acesso selecionado: {nivel_acesso} ✅")

        # Gerar convite para nível de acesso "Geral" ou "Admin"
        if nivel_acesso in ["Geral", "Admin"]:
            codigo_convite = generate_code()
            invites[codigo_convite] = {'nivel_acesso': nivel_acesso, 'grupo': 'Todos'}
            save_invites()

            # Remover reply_markup, se necessário
            if call.message and call.message.reply_markup:
                try:
                    await bot.edit_message_reply_markup(chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=None)
                except aiogram.utils.exceptions.MessageNotModified:
                    logger.warning(f"Mensagem não modificada: O conteúdo da mensagem e a marcação são os mesmos.")

            # Enviar o código de convite ao usuário
            await bot.send_message(chat_id=chat_id, text=f"🔑 Convite gerado! Envie este código ao utilizador:\n\n{codigo_convite}\n\n[Link para o bot](https://t.me/MainfashionBot)")
            
            # Oferecer opções de nova consulta ou sair
            markup = InlineKeyboardMarkup()
            markup.add(InlineKeyboardButton("✉️ Gerar Novo Convite", callback_data="nova_consulta_gerar_convite"))
            markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
            await bot.send_message(chat_id, "Escolha uma opção:", reply_markup=markup)

            logger.info(f"Convite gerado: {codigo_convite} para acesso {nivel_acesso}")
            await call.answer()

        # Processar nível de acesso "Gestor de Grupo", "Gestor de Loja", ou "Lojista"
        elif nivel_acesso in ["Gestor de Grupo", "Gestor de Loja", "Lojista"]:
            if user_info['nivel_acesso'] in ['Super Admin', 'Admin'] or \
               (user_info['nivel_acesso'] == 'Gestor de Grupo' and nivel_acesso in ['Gestor de Loja', 'Lojista']) or \
               (user_info['nivel_acesso'] == 'Gestor de Loja' and nivel_acesso == 'Lojista'):

                # Preparar opções de grupo
                markup = InlineKeyboardMarkup()
                grupos = ["OMNIA", "ONLY"] if user_info['nivel_acesso'] in ['Super Admin', 'Admin'] else [user_info['grupo']]
                for grupo in grupos:
                    markup.add(InlineKeyboardButton(grupo, callback_data=f"grupo_convite:{grupo}"))
                markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))

                # Remover reply_markup, se necessário
                if call.message and call.message.reply_markup:
                    try:
                        await bot.edit_message_reply_markup(chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=None)
                    except aiogram.utils.exceptions.MessageNotModified:
                        logger.warning(f"Mensagem não modificada: O conteúdo da mensagem e a marcação são os mesmos.")

                # Solicitar ao usuário para escolher um grupo de lojas
                await bot.send_message(chat_id=chat_id, text="Selecione o grupo de lojas para o convite:", reply_markup=markup)
                await call.answer()
            else:
                await bot.send_message(chat_id=chat_id, text="🚫 Você não tem permissão para gerar convites para esse nível de acesso.")

        # Caso o nível de acesso seja inválido ou não suportado
        else:
            grupo = user_info.get('grupo', 'Indefinido')
            if grupo == 'Indefinido':
                if user_info['nivel_acesso'] in ['Super Admin', 'Admin']:
                    grupo = 'Todos'
                else:
                    await bot.send_message(chat_id=chat_id, text="Erro de configuração: Grupo não definido. Por favor, contate o administrador.")
                    return

            # Preparar opções de lojas dentro do grupo
            prefixo_grupo = "OML" if grupo == "OMNIA" else "ONL"
            lojas_grupo = {k: v for k, v in stores.items() if k.startswith(prefixo_grupo)}
            user_states[chat_id]['grupo'] = grupo

            markup = InlineKeyboardMarkup()
            for loja in lojas_grupo:
                markup.add(InlineKeyboardButton(loja, callback_data=f"loja_convite:{loja}"))
            markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))

            # Remover reply_markup, se necessário
            if call.message and call.message.reply_markup:
                try:
                    await bot.edit_message_reply_markup(chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=None)
                except aiogram.utils.exceptions.MessageNotModified:
                    logger.warning(f"Mensagem não modificada: O conteúdo da mensagem e a marcação são os mesmos.")

            # Solicitar ao usuário para escolher uma loja
            await bot.send_message(chat_id=chat_id, text="Selecione a loja para o convite:", reply_markup=markup)
            await call.answer()

    except Exception as e:
        logger.error(f"Erro ao processar nível de acesso para convite: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=chat_id, text=f"Erro ao processar nível de acesso para convite: {str(e)}")

async def processar_grupo_convite(call: types.CallbackQuery):
    try:
        chat_id = call.message.chat.id
        grupo = call.data.split(":")[1].upper()
        user_states[chat_id]['grupo'] = grupo
        nivel_acesso = user_states[chat_id]['nivel_acesso']

        # Enviar feedback ao usuário sobre a escolha
        await bot.send_message(chat_id=call.message.chat.id, text=f"Você selecionou o grupo: {grupo} ✅")

        if nivel_acesso == "Gestor de Grupo":
            codigo_convite = generate_code()
            invites[codigo_convite] = {'nivel_acesso': nivel_acesso, 'grupo': grupo}
            save_invites()

            # Verifique se a mensagem já está sem marcação antes de tentar removê-la
            if call.message.reply_markup is not None:
                try:
                    await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
                except aiogram.utils.exceptions.MessageNotModified:
                    logger.warning(f"Mensagem não modificada: O conteúdo da mensagem e a marcação são os mesmos.")

            await bot.send_message(chat_id=call.message.chat.id, text=f"🔑 Convite gerado! Envie este código ao utilizador:\n\n{codigo_convite}\n\n[Link para o bot](https://t.me/MainfashionBot)")
            markup = InlineKeyboardMarkup()
            markup.add(InlineKeyboardButton("Gerar Novo Convite", callback_data="nova_consulta_gerar_convite"))
            markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
            await bot.send_message(chat_id, "Escolha uma opção:", reply_markup=markup)
            logger.info(f"Convite gerado: {codigo_convite} para grupo {grupo} com nível {nivel_acesso}")
            await call.answer()
        else:
            prefixo_grupo = "OML" if grupo == "OMNIA" else "ONL"
            lojas_grupo = {k: v for k, v in stores.items() if k.startswith(prefixo_grupo)}
            markup = InlineKeyboardMarkup()
            for loja in lojas_grupo:
                markup.add(InlineKeyboardButton(loja, callback_data=f"loja_convite:{loja}"))
            markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))

            # Verifique se a mensagem já está sem marcação antes de tentar removê-la
            if call.message.reply_markup is not None:
                try:
                    await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
                except aiogram.utils.exceptions.MessageNotModified:
                    logger.warning(f"Mensagem não modificada: O conteúdo da mensagem e a marcação são os mesmos.")

            await bot.send_message(chat_id=call.message.chat.id, text="Selecione a loja para o convite:", reply_markup=markup)
            await call.answer()
    except Exception as e:
        logger.error(f"Erro ao processar grupo de convite: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=call.message.chat.id, text=f"Erro ao processar grupo de convite: {str(e)}")

async def processar_loja_convite(call: types.CallbackQuery):
    try:
        chat_id = call.message.chat.id
        loja = call.data.split(":")[1]
        grupo = user_states[chat_id]['grupo']
        nivel_acesso = user_states[chat_id]['nivel_acesso']

        # Enviar feedback ao usuário sobre a escolha
        await bot.send_message(chat_id=call.message.chat.id, text=f"Você selecionou a loja: {loja} ✅")

        codigo_convite = generate_code()
        invites[codigo_convite] = {'nivel_acesso': nivel_acesso, 'grupo': grupo, 'loja': loja}
        save_invites()

        # Verifique se a mensagem já está sem marcação antes de tentar removê-la
        if call.message.reply_markup is not None:
            try:
                await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
            except aiogram.utils.exceptions.MessageNotModified:
                logger.warning(f"Mensagem não modificada: O conteúdo da mensagem e a marcação são os mesmos.")

        await bot.send_message(chat_id=call.message.chat.id, text=f"🔑 Convite gerado! Envie este código ao utilizador:\n\n{codigo_convite}\n\n[Link para o bot](https://t.me/MainfashionBot)")
        markup = InlineKeyboardMarkup()
        markup.add(InlineKeyboardButton("Gerar Novo Convite", callback_data="nova_consulta_gerar_convite"))
        markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
        await bot.send_message(chat_id, "Escolha uma opção:", reply_markup=markup)
        logger.info(f"Convite gerado: {codigo_convite} para loja {loja} do grupo {grupo} com nível {nivel_acesso}")
        await call.answer()
    except Exception as e:
        logger.error(f"Erro ao processar loja de convite: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=call.message.chat.id, text=f"Erro ao processar loja de convite: {str(e)}")

async def gerar_codigo_alteracao(call_or_message: Union[types.CallbackQuery, types.Message]):
    try:
        # Verifica se é uma mensagem ou um callback
        if isinstance(call_or_message, types.CallbackQuery):
            chat_id = call_or_message.message.chat.id
            nome_utilizador = call_or_message.from_user.first_name if call_or_message.from_user.first_name else "Utilizador"
        else:
            chat_id = call_or_message.chat.id
            nome_utilizador = call_or_message.from_user.first_name if call_or_message.from_user.first_name else "Utilizador"

        if str(chat_id) not in user_data and str(chat_id) != str(super_admin.get("chat_id")):
            await bot.send_message(chat_id, "🚫 Apenas Admins podem gerar códigos de alteração de nível de acesso.")
            return

        user_info = user_data.get(str(chat_id), super_admin)
        if user_info['nivel_acesso'] not in ['Super Admin', 'Admin']:
            await bot.send_message(chat_id, "🚫 Você não tem permissão para gerar códigos de alteração de nível de acesso.")
            return

        # Remove o markup anterior se for um callback
        if isinstance(call_or_message, types.CallbackQuery):
            await bot.edit_message_reply_markup(call_or_message.message.chat.id, call_or_message.message.message_id, reply_markup=None)

        # Define o estado do usuário
        user_states[chat_id] = {'step': 'nivel_acesso_alteracao'}
        markup = InlineKeyboardMarkup()
        niveis_acesso = ["Admin", "Geral", "Gestor de Grupo", "Gestor de Loja", "Lojista"]
        for nivel in niveis_acesso:
            markup.add(InlineKeyboardButton(nivel, callback_data=f"nivel_acesso_alteracao:{nivel}"))
        
        # Usa bot.send_message para enviar a mensagem com o markup
        await bot.send_message(chat_id, "📜 Selecione o nível de acesso para o código de alteração:", reply_markup=markup)

    except Exception as e:
        logger.error(f"Erro ao gerar código de alteração de nível de acesso: {str(e)}", exc_info=True)
        await bot.send_message(chat_id, f"Erro ao gerar código de alteração: {str(e)}")

async def processar_nivel_acesso_alteracao(call: types.CallbackQuery):
    try:
        chat_id = call.message.chat.id
        nivel_acesso = call.data.split(":")[1]
        user_states[chat_id] = {'step': 'codigo_alteracao', 'nivel_acesso': nivel_acesso}
        user_info = user_data.get(str(chat_id), super_admin)

        # Enviar feedback ao usuário sobre a escolha
        await bot.send_message(chat_id=call.message.chat.id, text=f"Nível de acesso selecionado: {nivel_acesso} ✅")

        if nivel_acesso in ["Geral", "Admin"]:
            # Gera um código de alteração e salva no alteration_codes
            codigo_alteracao = generate_code()
            alteration_codes[codigo_alteracao] = {'nivel_acesso': nivel_acesso, 'grupo': 'Todos'}
            save_alteration_codes()  # Salvar os códigos de alteração em alteration_codes.json

            # Verifica se o reply_markup não é None antes de tentar editar
            if call.message.reply_markup is not None:
                try:
                    await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
                except aiogram.utils.exceptions.MessageNotModified:
                    logger.warning("Mensagem não modificada: O conteúdo da mensagem e a marcação são os mesmos.")

            await bot.send_message(chat_id=call.message.chat.id, text=f"🔑 Código de alteração gerado! Envie este código ao utilizador:\n\n{codigo_alteracao}\n\n[Link para o bot](https://t.me/MainfashionBot)")
            markup = InlineKeyboardMarkup()
            markup.add(InlineKeyboardButton("Outra Alteração", callback_data="nova_consulta_alterar_nivel"))
            markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
            await bot.send_message(chat_id, "Escolha uma opção:", reply_markup=markup)
            logger.info(f"Código de alteração gerado: {codigo_alteracao} para acesso {nivel_acesso}")
            await call.answer()

        elif nivel_acesso in ["Gestor de Grupo", "Gestor de Loja", "Lojista"]:
            if user_info['nivel_acesso'] in ['Super Admin', 'Admin'] or (user_info['nivel_acesso'] == 'Gestor de Grupo' and nivel_acesso in ['Gestor de Loja', 'Lojista']) or (user_info['nivel_acesso'] == 'Gestor de Loja' and nivel_acesso == 'Lojista'):
                markup = InlineKeyboardMarkup()
                grupos = ["OMNIA", "ONLY"] if user_info['nivel_acesso'] in ['Super Admin', 'Admin'] else [user_info['grupo']]
                for grupo in grupos:
                    markup.add(InlineKeyboardButton(grupo, callback_data=f"grupo_alteracao:{grupo}"))
                markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))

                # Verifica se o reply_markup não é None antes de tentar editar
                if call.message.reply_markup is not None:
                    try:
                        await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
                    except aiogram.utils.exceptions.MessageNotModified:
                        logger.warning("Mensagem não modificada: O conteúdo da mensagem e a marcação são os mesmos.")

                await bot.send_message(chat_id=call.message.chat.id, text="Selecione o grupo de lojas para a alteração:", reply_markup=markup)
                await call.answer()
            else:
                await bot.send_message(chat_id=call.message.chat.id, text="🚫 Você não tem permissão para gerar códigos de alteração para esse nível de acesso.")

        else:
            grupo = user_info.get('grupo', 'Indefinido')
            if grupo == 'Indefinido':
                if user_info['nivel_acesso'] in ['Super Admin', 'Admin']:
                    grupo = 'Todos'
                else:
                    await bot.send_message(chat_id=call.message.chat.id, text="Erro de configuração: Grupo não definido. Por favor, contate o administrador.")
                    return

            prefixo_grupo = "OML" if grupo == "OMNIA" else "ONL"
            lojas_grupo = {k: v for k, v in stores.items() if k.startswith(prefixo_grupo)}
            user_states[chat_id]['grupo'] = grupo

            # Salvar a nova configuração do grupo no user_data
            user_data[str(chat_id)]['grupo'] = grupo
            save_user_data()

            markup = InlineKeyboardMarkup()
            for loja in lojas_grupo:
                markup.add(InlineKeyboardButton(loja, callback_data=f"loja_alteracao:{loja}"))
            markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))

            # Verifica se o reply_markup não é None antes de tentar editar
            if call.message.reply_markup is not None:
                try:
                    await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
                except aiogram.utils.exceptions.MessageNotModified:
                    logger.warning("Mensagem não modificada: O conteúdo da mensagem e a marcação são os mesmos.")

            await bot.send_message(chat_id=call.message.chat.id, text="Selecione a loja para a alteração:", reply_markup=markup)
            await call.answer()
    except Exception as e:
        logger.error(f"Erro ao processar nível de acesso para alteração: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=call.message.chat.id, text=f"Erro ao processar nível de acesso para alteração: {str(e)}")

async def processar_grupo_alteracao(call: types.CallbackQuery):
    try:
        chat_id = call.message.chat.id
        grupo = call.data.split(":")[1].upper()
        user_states[chat_id]['grupo'] = grupo
        nivel_acesso = user_states[chat_id]['nivel_acesso']

        # Enviar feedback ao usuário sobre a escolha do grupo
        await bot.send_message(chat_id, f"Você selecionou o grupo: {grupo} ✅")

        if nivel_acesso == "Gestor de Grupo":
            # Gera código de alteração para o grupo e salva em alteration_codes
            codigo_alteracao = generate_code()
            alteration_codes[codigo_alteracao] = {'nivel_acesso': nivel_acesso, 'grupo': grupo}
            save_alteration_codes()  # Salva os códigos de alteração no arquivo alteration_codes.json

            # Remove o markup anterior
            try:
                await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
            except aiogram.utils.exceptions.MessageNotModified:
                logger.warning(f"Mensagem já estava sem markup: {call.message.message_id}")

            # Envia o código de alteração ao usuário
            await bot.send_message(
                chat_id,
                f"🔑 Código de alteração gerado para o grupo {grupo}! Envie este código ao utilizador:\n\n{codigo_alteracao}\n\n[Link para o bot](https://t.me/MainfashionBot)"
            )

            # Criação de opções para o próximo passo
            markup = InlineKeyboardMarkup()
            markup.add(InlineKeyboardButton("Outra Alteração", callback_data="nova_consulta_alterar_nivel"))
            markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
            await bot.send_message(chat_id, "Escolha uma opção:", reply_markup=markup)

            logger.info(f"Código de alteração gerado: {codigo_alteracao} para grupo {grupo} com nível {nivel_acesso}")
            await call.answer()

        else:
            # Geração da lista de lojas associadas ao grupo
            prefixo_grupo = "OML" if grupo == "OMNIA" else "ONL"
            lojas_grupo = {k: v for k, v in stores.items() if k.startswith(prefixo_grupo)}

            # Cria o markup com as lojas disponíveis
            markup = InlineKeyboardMarkup()
            for loja in lojas_grupo:
                markup.add(InlineKeyboardButton(loja, callback_data=f"loja_alteracao:{loja}"))
            markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))

            # Remove o markup anterior
            try:
                await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
            except aiogram.utils.exceptions.MessageNotModified:
                logger.warning(f"Mensagem já estava sem markup: {call.message.message_id}")

            # Envia a nova seleção de lojas
            await bot.send_message(chat_id, "Selecione a loja para a alteração:", reply_markup=markup)
            await call.answer()

    except Exception as e:
        logger.error(f"Erro ao processar grupo de alteração: {str(e)}", exc_info=True)
        await bot.send_message(chat_id, f"Erro ao processar grupo de alteração: {str(e)}")

async def processar_loja_alteracao(call: types.CallbackQuery):
    try:
        chat_id = call.message.chat.id
        loja = call.data.split(":")[1]
        grupo = user_states[chat_id]['grupo']
        nivel_acesso = user_states[chat_id]['nivel_acesso']

        # Enviar feedback ao usuário sobre a escolha
        await bot.send_message(chat_id=call.message.chat.id, text=f"Você selecionou a loja: {loja} ✅")

        # Gera o código de alteração para a loja e salva em alteration_codes
        codigo_alteracao = generate_code()
        alteration_codes[codigo_alteracao] = {'nivel_acesso': nivel_acesso, 'grupo': grupo, 'loja': loja}
        save_alteration_codes()  # Salva o código de alteração no arquivo alteration_codes.json

        # Remove o markup anterior, se existir
        if call.message.reply_markup is not None:
            try:
                await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
            except aiogram.utils.exceptions.MessageNotModified:
                logger.warning(f"Mensagem não modificada: O conteúdo da mensagem e a marcação são os mesmos.")

        # Envia o código de alteração ao usuário
        await bot.send_message(chat_id=call.message.chat.id, text=f"🔑 Código de alteração gerado! Envie este código ao utilizador:\n\n{codigo_alteracao}\n\n[Link para o bot](https://t.me/MainfashionBot)")
        markup = InlineKeyboardMarkup()
        markup.add(InlineKeyboardButton("Outra Alteração", callback_data="nova_consulta_alterar_nivel"))
        markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
        await bot.send_message(chat_id, "Escolha uma opção:", reply_markup=markup)

        logger.info(f"Código de alteração gerado: {codigo_alteracao} para loja {loja} do grupo {grupo} com nível {nivel_acesso}")
        await call.answer()

    except Exception as e:
        logger.error(f"Erro ao processar loja de alteração: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=call.message.chat.id, text=f"Erro ao processar loja de alteração: {str(e)}")

# Função para lidar com a opção de "Sair"
async def sair_para_inicial(call: types.CallbackQuery):
    try:
        chat_id = call.message.chat.id

        # Remove o markup da mensagem anterior
        try:
            await bot.edit_message_reply_markup(chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=None)
        except aiogram.utils.exceptions.MessageNotModified:
            logger.warning(f"Mensagem já estava sem markup: {call.message.message_id}")

        # Envia a mensagem de retorno ao menu inicial
        await bot.send_message(chat_id, "Você voltou ao menu inicial. O que gostaria de fazer agora?")

        # Exibe o menu inicial
        await mostrar_menu_inicial(call)

        await call.answer()
    except Exception as e:
        logger.error(f"Erro ao sair para o menu inicial: {str(e)}", exc_info=True)
        await bot.send_message(chat_id, f"Erro ao retornar ao menu inicial: {str(e)}")

async def usarcodigo(call_or_message: Union[types.CallbackQuery, types.Message]):
    try:
        chat_id = call_or_message.message.chat.id if isinstance(call_or_message, types.CallbackQuery) else call_or_message.chat.id
        nome_utilizador = call_or_message.from_user.first_name if call_or_message.from_user.first_name else "Utilizador"

        if str(chat_id) not in user_data and str(chat_id) != str(super_admin.get("chat_id")):
            await bot.send_message(chat_id=chat_id, text="❌ Você não está registado. Use /registo para se registar.")
            return

        # Remove o markup anterior, se for callback
        if isinstance(call_or_message, types.CallbackQuery):
            await bot.edit_message_reply_markup(call_or_message.message.chat.id, call_or_message.message.message_id, reply_markup=None)

        user_states[chat_id] = {'step': 'codigo_alteracao'}
        await bot.send_message(chat_id=chat_id, text="🔑 Por favor, insira o código de alteração de nível de acesso:")
    except Exception as e:
        logger.error(f"Erro ao iniciar uso de código de alteração: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=chat_id, text=f"Erro ao iniciar uso de código de alteração: {str(e)}")

async def processar_codigo_alteracao(message: types.Message):
    try:
        chat_id = message.chat.id
        logger.info(f"Processando código de alteração para chat_id: {chat_id}")
        codigo_alteracao = message.text.strip()  # Remove espaços em branco

        # Verifica se o usuário está no estado correto para processar a alteração
        if chat_id in user_states and user_states[chat_id].get('step') == 'codigo_alteracao':
            
            # Verifica se o código de alteração é válido
            if codigo_alteracao not in alteration_codes:
                await bot.send_message(chat_id=message.chat.id, text="❌ Código de alteração inválido. Tente novamente.")
                return

            # Recupera as informações de alteração e remove o código do arquivo
            alteration_info = alteration_codes.pop(codigo_alteracao)
            save_alteration_codes()  # Salva os códigos atualizados, sem o código utilizado

            # Atualiza o nível de acesso do usuário
            nivel_acesso = alteration_info['nivel_acesso']
            user_data[str(chat_id)]['nivel_acesso'] = nivel_acesso
            save_user_data()  # Salva os dados do usuário atualizados

            # Envia confirmação ao usuário
            await bot.send_message(chat_id=message.chat.id, text=f"✅ Alteração de nível concluída! Agora tem acesso ao nível {nivel_acesso}. Use /start para iniciar a aplicação.")
            logger.info(f"Utilizador {get_user_info(message)} alterou nível de acesso para: {nivel_acesso}")

        else:
            # Caso o usuário não esteja no estado correto
            logger.warning(f"Usuário {chat_id} não está no estado correto para processar código de alteração.")
            await bot.send_message(chat_id=message.chat.id, text="⚠️ Você não está no processo de alteração de nível. Por favor, inicie o processo novamente.")
    except Exception as e:
        logger.error(f"Erro ao processar código de alteração: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=message.chat.id, text=f"Erro ao processar código de alteração: {str(e)}")

async def apagar_utilizador(call_or_message: Union[types.CallbackQuery, types.Message]):
    try:
        chat_id = call_or_message.message.chat.id if isinstance(call_or_message, types.CallbackQuery) else call_or_message.chat.id
        user_info = user_data.get(str(chat_id), super_admin)

        if user_info['nivel_acesso'] not in ["Super Admin", "Admin"]:
            await bot.send_message(chat_id=chat_id, text="🚫 Você não tem permissão para apagar utilizadores.")
            return

        # Remove o markup anterior, se for callback
        if isinstance(call_or_message, types.CallbackQuery):
            await bot.edit_message_reply_markup(call_or_message.message.chat.id, call_or_message.message.message_id, reply_markup=None)

        user_states[chat_id] = {'step': 'apagar_usuario'}
        await bot.send_message(chat_id=chat_id, text="🗑️ Insira o Chat ID do utilizador que deseja remover, por favor:")

    except Exception as e:
        logger.error(f"Erro ao processar a remoção de utilizador: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=chat_id, text=f"⚠️ Ocorreu um erro ao processar a remoção de utilizador: {str(e)}")

async def processar_apagar_usuario(message: types.Message):
    try:
        chat_id = message.chat.id
        chat_id_remover = message.text.strip()

        if chat_id_remover not in user_data:
            await bot.send_message(chat_id=message.chat.id, text="⚠️ Utilizador não encontrado. Por favor, insira um Chat ID válido.")
            return

        user_info = user_data.get(str(chat_id), super_admin)
        nivel_acesso = user_info.get('nivel_acesso', 'Indefinido')
        if nivel_acesso in ['Super Admin', 'Admin'] or (nivel_acesso == 'Gestor de Grupo' and user_data[chat_id_remover]['nivel_acesso'] in ['Gestor de Loja', 'Lojista']) or (nivel_acesso == 'Gestor de Loja' and user_data[chat_id_remover]['nivel_acesso'] == 'Lojista'):
            del user_data[chat_id_remover]
            save_user_data()
            await bot.send_message(chat_id=message.chat.id, text=f"✅ Utilizador com Chat ID {chat_id_remover} foi removido com sucesso.")
            logger.info(f"({chat_id}) removeu o utilizador com Chat ID {chat_id_remover}")
            # Adicionar botões de "Remover Outro Utilizador" e "Sair"
            markup = InlineKeyboardMarkup()
            markup.add(InlineKeyboardButton("Remover Outro Utilizador", callback_data="nova_consulta_apagar_utilizador"))
            markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
            await bot.send_message(chat_id, "📜 O que você deseja fazer a seguir?", reply_markup=markup)
        else:
            await bot.send_message(chat_id=message.chat.id, text="🚫 Você não tem permissão para remover este utilizador.")
    except Exception as e:
        logger.error(f"Erro ao apagar utilizador: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=message.chat.id, text=f"Erro ao apagar utilizador: {str(e)}")

async def listar_usuarios(call_or_message: Union[types.CallbackQuery, types.Message]):
    try:
        chat_id = call_or_message.message.chat.id if isinstance(call_or_message, types.CallbackQuery) else call_or_message.chat.id
        nome_utilizador = call_or_message.from_user.first_name if call_or_message.from_user.first_name else "Utilizador"

        if str(chat_id) not in user_data and str(chat_id) != str(super_admin.get("chat_id")):
            await bot.send_message(chat_id=chat_id, text="❌ Não está registado. Utilize /registo para se registar.")
            return

        nivel_acesso = user_data.get(str(chat_id), super_admin).get('nivel_acesso', 'Indefinido')

        if nivel_acesso not in ['Super Admin', 'Admin', 'Gestor de Grupo', 'Gestor de Loja']:
            await bot.send_message(chat_id=chat_id, text="🚫 Apenas Super Admins, Admins e gestores podem listar utilizadores.")
            return

        resposta = "📜 Utilizadores:\n"
        for uid, info in user_data.items():
            username = info.get('username', 'N/A')
            resposta += f"{uid}: {username} - {info.get('nivel_acesso', 'Indefinido')}\n"

        # Remove o markup anterior, se for callback
        if isinstance(call_or_message, types.CallbackQuery):
            await bot.edit_message_reply_markup(call_or_message.message.chat.id, call_or_message.message.message_id, reply_markup=None)

        markup = InlineKeyboardMarkup()
        markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))

        await bot.send_message(chat_id=chat_id, text=resposta, reply_markup=markup)

    except Exception as e:
        logger.error(f"Erro ao listar utilizadores: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=chat_id, text=f"Erro ao listar utilizadores: {str(e)}")

# Função principal para exportação de dados
async def exportardados(call_or_message: Union[types.CallbackQuery, types.Message]):
    try:
        # Remover o markup anterior (se houver) apenas se for um callback
        if isinstance(call_or_message, types.CallbackQuery):
            try:
                await bot.edit_message_reply_markup(call_or_message.message.chat.id, call_or_message.message.message_id, reply_markup=None)
            except aiogram.utils.exceptions.MessageNotModified:
                logger.warning(f"Mensagem já estava sem markup: {call_or_message.message.message_id}")
            chat_id = call_or_message.message.chat.id
            nome_utilizador = call_or_message.from_user.first_name if call_or_message.from_user.first_name else "Utilizador"
        else:
            chat_id = call_or_message.chat.id
            nome_utilizador = call_or_message.from_user.first_name if call_or_message.from_user.first_name else "Utilizador"

        # Verificar se o usuário está registrado
        if str(chat_id) not in user_data and str(chat_id) != str(super_admin.get("chat_id")):
            if isinstance(call_or_message, types.CallbackQuery):
                await bot.send_message(chat_id, "❌ Não está registado. Utilize /registo para se registar.")
            else:
                await call_or_message.reply("❌ Não está registado. Utilize /registo para se registar.")
            return

        user_info = get_user_info(call_or_message)
        user_record = user_data.get(str(chat_id), super_admin)

        # Verificar se o nível de acesso foi definido
        if 'nivel_acesso' not in user_record:
            if isinstance(call_or_message, types.CallbackQuery):
                await bot.send_message(chat_id, "Erro de configuração: Nível de acesso não definido. Por favor, contate o administrador.")
            else:
                await call_or_message.reply("Erro de configuração: Nível de acesso não definido. Por favor, contate o administrador.")
            return

        # Preparar os dados do usuário
        nivel_acesso = user_record['nivel_acesso']
        grupo = user_record.get('grupo', 'Todos')
        loja = user_record.get('loja', 'Todas')

        # Criação do menu para exportação de dados
        markup = InlineKeyboardMarkup()

        if nivel_acesso in ["Super Admin", "Admin"]:
            grupos = ["OMNIA", "ONLY"]
            for grupo in grupos:
                markup.add(InlineKeyboardButton(grupo, callback_data=f"exportar_grupo:{grupo}"))
        elif nivel_acesso == "Gestor de Grupo":
            prefixo_grupo = "OML" if grupo == "OMNIA" else "ONL"
            lojas_grupo = [loja for loja in stores.keys() if loja.startswith(prefixo_grupo)]
            for loja in lojas_grupo:
                markup.add(InlineKeyboardButton(loja, callback_data=f"exportar_loja:{loja}"))
        elif nivel_acesso == "Gestor de Loja":
            markup.add(InlineKeyboardButton(loja, callback_data=f"exportar_loja:{loja}"))

        # Verificação final e envio da mensagem
        if markup.inline_keyboard:  # Enviar apenas se houver opções disponíveis
            markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
            if isinstance(call_or_message, types.CallbackQuery):
                await bot.send_message(chat_id, "Escolha a loja para exportação dos dados:", reply_markup=markup)
            else:
                await call_or_message.reply("Escolha a loja para exportação dos dados:", reply_markup=markup)
        else:
            if isinstance(call_or_message, types.CallbackQuery):
                await bot.send_message(chat_id, "🚫 Você não tem permissão para exportar dados.")
            else:
                await call_or_message.reply("🚫 Você não tem permissão para exportar dados.")

    except Exception as e:
        logger.error(f"Erro ao processar exportação de dados: {str(e)}", exc_info=True)
        if isinstance(call_or_message, types.CallbackQuery):
            await bot.send_message(chat_id, f"Erro ao processar exportação de dados: {str(e)}")
        else:
            await call_or_message.reply(f"Erro ao processar exportação de dados: {str(e)}")

# Função para processar exportação por grupo
async def process_exportar_grupo(call: types.CallbackQuery):
    try:
        user_info = get_user_info(call.message)
        grupo = call.data.split(":")[1]
        await call.answer(f"Grupo selecionado: {grupo} ✅")
        logger.info(f"Grupo selecionado: {grupo} por {user_info}")

        # Remove os botões da mensagem anterior
        try:
            await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
        except aiogram.utils.exceptions.MessageNotModified:
            logger.warning(f"Mensagem já estava sem markup ou não pôde ser modificada: {call.message.message_id}")

        # Enviar nova mensagem para confirmar seleção do grupo
        await bot.send_message(call.message.chat.id, f"Grupo {grupo} selecionado! ✅")

        # Seleção de loja dentro do grupo
        prefixo_grupo = "OML" if grupo == "OMNIA" else "ONL"
        lojas = [loja for loja in stores.keys() if loja.startswith(prefixo_grupo)]

        # Verificação se existem lojas associadas ao grupo
        if lojas:
            # Criação do menu para lojas
            markup = InlineKeyboardMarkup()
            for loja in lojas:
                markup.add(InlineKeyboardButton(loja, callback_data=f"exportar_loja:{loja}"))
            markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
            await bot.send_message(call.message.chat.id, "Selecione a loja que deseja consultar:", reply_markup=markup)
        else:
            await bot.send_message(call.message.chat.id, "🚫 Não existem lojas disponíveis para este grupo.")

    except Exception as e:
        logger.error(f"Erro ao processar grupo para exportação: {str(e)}", exc_info=True)
        await bot.send_message(call.message.chat.id, f"Erro ao processar grupo para exportação: {str(e)}")

# Função para processar exportação por loja
async def process_exportar_loja(call: types.CallbackQuery):
    try:
        user_info = get_user_info(call.message)
        loja = call.data.split(":")[1]
        await call.answer(f"Loja selecionada: {loja} ✅")
        logger.info(f"Loja selecionada: {loja} por {user_info}")

        # Remove os botões da mensagem anterior
        try:
            await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
        except aiogram.utils.exceptions.MessageNotModified:
            logger.warning(f"Mensagem já estava sem markup ou não pôde ser modificada: {call.message.message_id}")

        # Enviar nova mensagem para confirmar seleção da loja
        await bot.send_message(call.message.chat.id, f"Loja {loja} selecionada! ✅")

        # Configura estado e solicita data/hora de início para exportação
        user_states[call.message.chat.id] = {'loja': loja, 'step': 'data_hora_inicio_exportar'}
        await bot.send_message(call.message.chat.id, "🕒 Insira a data e hora de início para exportação (formato: YYYY-MM-DD HH:MM:SS):")

    except Exception as e:
        logger.error(f"Erro ao processar loja para exportação: {str(e)}", exc_info=True)
        await bot.send_message(call.message.chat.id, f"Erro ao processar loja para exportação: {str(e)}")

# Função para processar data e hora de início
async def processar_data_hora_inicio_exportar(message: types.Message):
    try:
        user_info = get_user_info(message)
        chat_id = message.chat.id
        if chat_id in user_states and user_states[chat_id]['step'] == 'data_hora_inicio_exportar':
            # Processa a data e hora de início no formato YYYY-MM-DD HH:MM:SS
            data_hora_inicio = datetime.strptime(message.text, '%Y-%m-%d %H:%M:%S')
            user_states[chat_id]['data_hora_inicio'] = data_hora_inicio
            user_states[chat_id]['step'] = 'data_hora_fim_exportar'
            await bot.send_message(chat_id=message.chat.id, text=f"✅ Data e hora de início selecionadas: {data_hora_inicio.strftime('%Y-%m-%d %H:%M:%S')} ✅")
            await bot.send_message(chat_id=message.chat.id, text="🕒 Insira a data e hora de fim para exportação (formato: YYYY-MM-DD HH:MM:SS):")
            logger.info(f"Data e hora de início {data_hora_inicio.strftime('%Y-%m-%d %H:%M:%S')} selecionadas para a loja {user_states[chat_id]['loja']} por {user_info}")
    except ValueError:
        await bot.send_message(chat_id=message.chat.id, text="❌ Formato de data e hora inválido. Por favor, insira no formato: YYYY-MM-DD HH:MM:SS")

# Função para processar data e hora de fim
async def processar_data_hora_fim_exportar(message: types.Message):
    try:
        user_info = get_user_info(message)
        chat_id = message.chat.id
        if chat_id in user_states and user_states[chat_id]['step'] == 'data_hora_fim_exportar':
            # Processa a data e hora de fim no formato YYYY-MM-DD HH:MM:SS
            data_hora_fim = datetime.strptime(message.text, '%Y-%m-%d %H:%M:%S')
            data_hora_inicio = user_states[chat_id]['data_hora_inicio']
            loja = user_states[chat_id]['loja']
            user_states[chat_id]['data_hora_fim'] = data_hora_fim
            await bot.send_message(chat_id=message.chat.id, text=f"✅ Data e hora de fim selecionadas: {data_hora_fim.strftime('%Y-%m-%d %H:%M:%S')} ✅")
            await exportar_dados(message, loja, data_hora_inicio, data_hora_fim)
            logger.info(f"Data e hora de fim {data_hora_fim.strftime('%Y-%m-%d %H:%M:%S')} selecionadas para a loja {loja} por {user_info}")
    except ValueError:
        await bot.send_message(chat_id=message.chat.id, text="❌ Formato de data e hora inválido. Por favor, insira no formato: YYYY-MM-DD HH:MM:SS")

async def exportar_dados(message, loja, data_inicio, data_fim):
    try:
        session = Session()

        # Consultar vendas e transações, agrupados por hora (usando strftime para SQLite)
        vendas_por_hora = session.query(
            func.strftime('%Y-%m-%d %H:00:00', SaleData.data).label('hora'),
            func.sum(SaleData.valor_venda_com_iva).label('total_vendas_com_iva'),
            func.sum(SaleData.valor_venda_sem_iva).label('total_vendas_sem_iva'),
            func.count(distinct(SaleData.referencia_documento)).label('transacoes_vendas')
        ).filter(
            SaleData.loja == loja,
            SaleData.data >= data_inicio,
            SaleData.data <= data_fim,
            ~SaleData.item.in_(itens_desconsiderados)
        ).group_by(func.strftime('%Y-%m-%d %H:00:00', SaleData.data)).all()

        # Consultar visitantes agrupados por hora (usando strftime para SQLite)
        visitantes_por_hora = session.query(
            func.strftime('%Y-%m-%d %H:00:00', PeopleCountingData.start_time).label('hora'),
            func.sum(PeopleCountingData.line1_in + PeopleCountingData.line2_in + PeopleCountingData.line3_in).label('visitantes')
        ).filter(
            PeopleCountingData.loja == loja,
            PeopleCountingData.start_time >= data_inicio,
            PeopleCountingData.end_time <= data_fim
        ).group_by(func.strftime('%Y-%m-%d %H:00:00', PeopleCountingData.start_time)).all()

        # Consultar total de passagens agrupadas por hora (usando strftime para SQLite)
        passagens_por_hora = session.query(
            func.strftime('%Y-%m-%d %H:00:00', PeopleCountingData.start_time).label('hora'),
            func.sum(PeopleCountingData.line4_in).label('total_line4_in'),
            func.sum(PeopleCountingData.line4_out).label('total_line4_out')
        ).filter(
            PeopleCountingData.loja == loja,
            PeopleCountingData.start_time >= data_inicio,
            PeopleCountingData.end_time <= data_fim
        ).group_by(func.strftime('%Y-%m-%d %H:00:00', PeopleCountingData.start_time)).all()

        # Montar um dicionário de resultados por hora
        resultados = []

        # Criar dicionários temporários para facilitar o merge das consultas
        vendas_dict = {venda.hora: venda for venda in vendas_por_hora}
        visitantes_dict = {visitante.hora: visitante for visitante in visitantes_por_hora}
        passagens_dict = {passagem.hora: passagem for passagem in passagens_por_hora}

        # Obter todas as horas únicas em que houve dados
        todas_as_horas = sorted(set(vendas_dict.keys()).union(visitantes_dict.keys()).union(passagens_dict.keys()))

        for hora in todas_as_horas:
            total_vendas_com_iva = vendas_dict.get(hora).total_vendas_com_iva if hora in vendas_dict else 0
            total_vendas_sem_iva = vendas_dict.get(hora).total_vendas_sem_iva if hora in vendas_dict else 0
            transacoes_vendas = vendas_dict.get(hora).transacoes_vendas if hora in vendas_dict else 0

            visitantes = visitantes_dict.get(hora).visitantes if hora in visitantes_dict else 0

            total_line4_in = passagens_dict.get(hora).total_line4_in if hora in passagens_dict else 0
            total_line4_out = passagens_dict.get(hora).total_line4_out if hora in passagens_dict else 0
            total_passagens = total_line4_in + total_line4_out

            # Calcular taxa de conversão e taxa de captação
            taxa_conversao = (transacoes_vendas / visitantes * 100) if visitantes > 0 else 0
            taxa_captacao = (visitantes / total_passagens * 100) if total_passagens > 0 else 0

            # Adicionar os resultados para a hora atual
            resultados.append({
                'Hora': hora,
                'Total de Vendas com IVA': total_vendas_com_iva,
                'Total de Vendas sem IVA': total_vendas_sem_iva,
                'Transações': transacoes_vendas,
                'Visitantes': visitantes,
                'Taxa de Conversão (%)': taxa_conversao,
                'Total de Passagens': total_passagens,
                'Taxa de Captação (%)': taxa_captacao
            })

        # Criar um DataFrame a partir dos resultados
        df = pd.DataFrame(resultados)

        # Definir o nome do arquivo
        nome_arquivo = f'export_{loja}_{data_inicio.strftime("%Y%m%d_%H%M")}_to_{data_fim.strftime("%Y%m%d_%H%M")}.xlsx'

        # Salvar os dados em um arquivo Excel
        df.to_excel(nome_arquivo, index=False)

        # Enviar o arquivo ao usuário via Telegram
        with open(nome_arquivo, 'rb') as arquivo:
            await bot.send_document(message.chat.id, arquivo)

        # Remover o arquivo após envio
        os.remove(nome_arquivo)

        # Informar o sucesso da exportação
        await bot.send_message(message.chat.id, "✅ Exportação concluída com sucesso!")
        logger.info(f"Arquivo {nome_arquivo} gerado e enviado com sucesso.")
    
    except Exception as e:
        # Logar e informar o erro
        logger.error(f"Erro ao exportar dados: {str(e)}", exc_info=True)
        await bot.send_message(message.chat.id, f"Erro ao exportar dados: {str(e)}")
    
    finally:
        # Fechar a sessão do banco de dados
        session.close()

    # Adicionar opções de nova consulta ou sair
    markup = InlineKeyboardMarkup()
    markup.add(InlineKeyboardButton("Nova Consulta", callback_data="nova_consulta_exportar"))
    markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
    await bot.send_message(message.chat.id, "📊 Deseja iniciar uma nova consulta ou sair?", reply_markup=markup)

async def processar_nova_consulta_exportar(call: types.CallbackQuery):
    try:
        user_info = get_user_info(call.message)
        logger.info(f"Nova consulta de exportação solicitada por {user_info}")

        # Remove o markup anterior
        try:
            await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
        except aiogram.utils.exceptions.MessageNotModified:
            logger.warning(f"Mensagem já estava sem markup: {call.message.message_id}")

        # Chamar o menu de exportação de dados
        await exportardados(call)
    except Exception as e:
        logger.error(f"Erro ao processar nova consulta de exportação: {str(e)}", exc_info=True)
        await bot.send_message(call.message.chat.id, "⚠️ Houve um problema ao iniciar uma nova consulta de exportação. Por favor, utilize /exportardados para reiniciar o processo.")

# Função principal de consulta
async def consultar(call_or_message: Union[types.CallbackQuery, types.Message]):
    try:
        # Check if it's a message or a callback query
        if isinstance(call_or_message, types.CallbackQuery):
            chat_id = call_or_message.message.chat.id
            nome_utilizador = call_or_message.from_user.first_name if call_or_message.from_user.first_name else "Utilizador"
        else:
            chat_id = call_or_message.chat.id
            nome_utilizador = call_or_message.from_user.first_name if call_or_message.from_user.first_name else "Utilizador"

        # Check if the user is registered
        if str(chat_id) not in user_data and str(chat_id) != str(super_admin.get("chat_id")):
            await call_or_message.answer(f"❌ Olá {nome_utilizador}, ainda não está registado. Utilize /registo para se registar.")
            return

        user_info = get_user_info(call_or_message)
        user_record = user_data.get(str(chat_id), super_admin)

        if 'nivel_acesso' not in user_record:
            await call_or_message.answer("Erro de configuração: Nível de acesso não definido. Por favor, contate o administrador.")
            return

        nivel_acesso = user_record['nivel_acesso']
        grupo = user_record.get('grupo', 'Todos')

        logger.info(f"Comando /consultar recebido por {user_info}")

        # Safely remove reply markup from the previous message, if any
        if isinstance(call_or_message, types.CallbackQuery) and call_or_message.message.reply_markup:
            try:
                await bot.edit_message_reply_markup(call_or_message.message.chat.id, call_or_message.message.message_id, reply_markup=None)
            except aiogram.utils.exceptions.MessageNotModified:
                logger.warning(f"Mensagem {call_or_message.message.message_id} já não tinha markup.")

        # Update the user state to 'consultar' before proceeding
        user_states[chat_id] = {'step': 'consultar'}

        # Notify the user
        if isinstance(call_or_message, types.CallbackQuery):
            await bot.send_message(call_or_message.message.chat.id, "Você escolheu: Consultar Lojas")
        else:
            await bot.send_message(call_or_message.chat.id, "Você escolheu: Consultar Lojas")

        # Create the markup with options based on user level
        markup = InlineKeyboardMarkup()

        if nivel_acesso in ["Super Admin", "Admin", "Geral"]:
            grupos = ["OMNIA", "ONLY"]
            for grupo in grupos:
                markup.add(InlineKeyboardButton(grupo, callback_data=f"consultar_selecionar_grupo:{grupo}"))
        elif nivel_acesso == "Gestor de Grupo":
            prefixo_grupo = "OML" if grupo == "OMNIA" else "ONL"
            lojas = [loja for loja in stores.keys() if loja.startswith(prefixo_grupo)]
            for loja in lojas:
                markup.add(InlineKeyboardButton(loja, callback_data=f"consultar_selecionar_loja:{loja}"))
        elif nivel_acesso in ["Gestor de Loja", "Lojista"]:
            loja = user_record.get('loja')
            if loja:
                markup.add(InlineKeyboardButton(loja, callback_data=f"consultar_selecionar_loja:{loja}"))
            else:
                await bot.send_message(chat_id, "🚫 Loja não encontrada para o seu nível de acesso.")

        # Send the message with the options to the user
        if markup.inline_keyboard:
            markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
            if isinstance(call_or_message, types.CallbackQuery):
                await bot.send_message(call_or_message.message.chat.id, "Escolha o grupo ou a loja que quer consultar:", reply_markup=markup)
            else:
                await bot.send_message(call_or_message.chat.id, "Escolha o grupo ou a loja que quer consultar:", reply_markup=markup)
        else:
            if isinstance(call_or_message, types.CallbackQuery):
                await bot.send_message(call_or_message.message.chat.id, "🚫 Você não tem permissão para consultar lojas.")
            else:
                await bot.send_message(call_or_message.chat.id, "🚫 Você não tem permissão para consultar lojas.")

    except Exception as e:
        logger.error(f"Erro ao configurar consulta: {str(e)}", exc_info=True)
        if isinstance(call_or_message, types.CallbackQuery):
            await bot.send_message(call_or_message.message.chat.id, f"Erro ao configurar consulta: {str(e)}")
        else:
            await bot.send_message(call_or_message.chat.id, f"Erro ao configurar consulta: {str(e)}")

# Função para processar seleção de grupo
async def processar_selecao_grupo(call: types.CallbackQuery):
    try:
        chat_id = call.message.chat.id

        # Verificar o estado
        if chat_id not in user_states or user_states[chat_id].get('step') != 'consultar':
            logger.warning(f"Usuário {chat_id} não estava no estado 'consultar' ou não selecionou um grupo.")
            await call.answer("Por favor, inicie uma nova consulta.")
            return

        user_info = get_user_info(call.message)
        grupo = call.data.split(":")[1]

        # Remover os botões da mensagem anterior
        try:
            await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
        except aiogram.utils.exceptions.MessageNotModified:
            logger.warning(f"Mensagem já estava sem markup ou não pôde ser modificada: {call.message.message_id}")

        # Enviar nova mensagem com a confirmação da seleção
        await bot.send_message(call.message.chat.id, f"Grupo {grupo} selecionado! ✅")
        logger.info(f"Grupo selecionado: {grupo} por {user_info}")

        # Criação de opções de loja para o grupo selecionado
        prefixo_grupo = "OML" if grupo == "OMNIA" else "ONL"
        lojas = [loja for loja in stores.keys() if loja.startswith(prefixo_grupo)]

        markup = InlineKeyboardMarkup()
        for loja in lojas:
            markup.add(InlineKeyboardButton(loja, callback_data=f"consultar_selecionar_loja:{loja}"))
        markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))

        # Envia a seleção de lojas
        await bot.send_message(call.message.chat.id, "Selecione a loja que deseja consultar:", reply_markup=markup)
    except Exception as e:
        logger.error(f"Erro ao processar seleção de grupo: {str(e)}", exc_info=True)
        await bot.send_message(call.message.chat.id, f"Erro ao processar seleção de grupo: {str(e)}")

async def processar_selecao_loja(call: types.CallbackQuery):
    try:
        chat_id = call.message.chat.id

        # Verificar o estado
        if chat_id not in user_states or user_states[chat_id].get('step') != 'consultar':
            logger.warning(f"Usuário {chat_id} não estava no estado 'consultar' ou não selecionou uma loja.")
            await call.answer("Por favor, inicie uma nova consulta.")
            return

        user_info = get_user_info(call.message)
        loja = call.data.split(":")[1]

        # Remover os botões da mensagem anterior
        try:
            await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
        except aiogram.utils.exceptions.MessageNotModified:
            logger.warning(f"Mensagem já estava sem markup ou não pôde ser modificada: {call.message.message_id}")

        # Enviar nova mensagem com a confirmação da seleção
        await bot.send_message(call.message.chat.id, f"Loja {loja} selecionada! ✅")
        logger.info(f"Loja selecionada: {loja} por {user_info}")

        # Criação de opções de período para a loja selecionada
        markup = InlineKeyboardMarkup()
        for periodo in PERIODOS:
            markup.add(InlineKeyboardButton(periodo, callback_data=f"periodo:{loja}:{periodo}"))
        markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))

        # Envia a seleção de períodos
        await bot.send_message(call.message.chat.id, "Selecione o período que deseja consultar:", reply_markup=markup)
    except Exception as e:
        logger.error(f"Erro ao processar seleção de loja: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=call.message.chat.id, text=f"Erro ao processar seleção de loja: {str(e)}")

# Função para consultar grupo
async def consultar_grupo(call_or_message: Union[types.CallbackQuery, types.Message]):
    try:
        # Verifica se é uma mensagem ou um callback
        if isinstance(call_or_message, types.CallbackQuery):
            chat_id = call_or_message.message.chat.id
            nome_utilizador = call_or_message.from_user.first_name if call_or_message.from_user.first_name else "Utilizador"
        else:
            chat_id = call_or_message.chat.id
            nome_utilizador = call_or_message.from_user.first_name if call_or_message.from_user.first_name else "Utilizador"

        # Verifica se o usuário está registrado
        if str(chat_id) not in user_data and str(chat_id) != str(super_admin.get("chat_id")):
            await bot.send_message(chat_id, f"❌ Olá {nome_utilizador}, ainda não está registado. Utilize /registo para se registar.")
            return

        user_info = get_user_info(call_or_message)
        user_record = user_data.get(str(chat_id), super_admin)

        if 'nivel_acesso' not in user_record:
            await bot.send_message(chat_id, "Erro de configuração: Nível de acesso não definido. Por favor, contate o administrador.")
            return

        nivel_acesso = user_record['nivel_acesso']
        grupo = user_record.get('grupo', 'Todos')

        logger.info(f"Comando /consultargrupo recebido por {user_info}")

        # Remover o markup anterior (se houver)
        if isinstance(call_or_message, types.CallbackQuery):
            try:
                await bot.edit_message_reply_markup(call_or_message.message.chat.id, call_or_message.message.message_id, reply_markup=None)
            except aiogram.utils.exceptions.MessageNotModified:
                logger.warning(f"Mensagem já estava sem markup: {call_or_message.message.message_id}")

        # Feedback para o usuário
        await bot.send_message(chat_id, "Você escolheu: Consultar Grupo")

        # Criação do markup
        markup = InlineKeyboardMarkup()
        if nivel_acesso in ["Super Admin", "Admin", "Geral"]:
            grupos = ["OMNIA", "ONLY"]
            for grupo in grupos:
                markup.add(InlineKeyboardButton(grupo, callback_data=f"consultar_grupo:{grupo}"))
        elif nivel_acesso == "Gestor de Grupo":
            markup.add(InlineKeyboardButton(grupo, callback_data=f"consultar_grupo:{grupo}"))

        # Enviar as opções de grupos disponíveis, se houver
        if markup.inline_keyboard:
            markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
            await bot.send_message(chat_id, "Selecione o grupo que deseja consultar:", reply_markup=markup)
        else:
            await bot.send_message(chat_id, "🚫 Você não tem permissão para consultar grupos.")
    except Exception as e:
        logger.error(f"Erro ao configurar consulta de grupo: {str(e)}", exc_info=True)
        await bot.send_message(chat_id, f"Erro ao configurar consulta de grupo: {str(e)}")

async def processar_consultar_grupo(call: types.CallbackQuery):
    try:
        # Extrai as informações do usuário e do grupo selecionado
        user_info = get_user_info(call.message)
        grupo = call.data.split(":")[1]

        # Tenta responder à consulta
        try:
            await call.answer(f"Grupo selecionado: {grupo} ✅", show_alert=False)
        except InvalidQueryID:
            logger.warning(f"Query ID inválido ou expirado ao responder ao callback do usuário {user_info}")

        logger.info(f"Grupo selecionado: {grupo} por {user_info}")

        # Verifica se a mensagem já foi processada (se não houver mais reply_markup)
        if call.message.reply_markup is None:
            return  # Não faz nada se já foi processado anteriormente

        # Remove a reply_markup da mensagem anterior
        try:
            await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
        except aiogram.utils.exceptions.MessageNotModified:
            logger.warning(f"A mensagem no chat ID {call.message.chat.id} não foi modificada.")

        # Envia uma nova mensagem confirmando a seleção do grupo
        await bot.send_message(call.message.chat.id, f"Grupo {grupo} selecionado! ✅")

        # Monta o markup para seleção de período
        markup = InlineKeyboardMarkup()
        for periodo in PERIODOS:
            markup.add(InlineKeyboardButton(periodo, callback_data=f"periodo_grupo:{grupo}:{periodo}"))
        markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))

        # Envia o markup para o usuário selecionar o período
        await bot.send_message(call.message.chat.id, "Selecione o período que deseja consultar:", reply_markup=markup)

        # Iniciar o timeout para a interação
        asyncio.create_task(set_interaction_timeout(call.message.chat.id))

    except Exception as e:
        logger.error(f"Erro ao processar o grupo {grupo} para consulta: {str(e)}", exc_info=True)
        await bot.send_message(call.message.chat.id, f"Erro ao processar grupo para consulta: {str(e)}")

async def process_consultar_grupo(call: types.CallbackQuery):
    try:
        user_info = get_user_info(call.message)
        grupo = call.data.split(":")[1]

        # Verifica se já foi enviado
        if call.message.text == f"Grupo {grupo} selecionado! ✅" or call.message.reply_markup is None:
            return  # Não faz nada se já foi processado

        try:
            await call.answer(f"Grupo selecionado: {grupo} ✅", show_alert=False)
        except InvalidQueryID:
            logger.warning("Query ID inválido ou timeout expirado ao responder à callback query.")

        logger.info(f"Grupo selecionado: {grupo} por {user_info}")

        # Tenta editar a mensagem, mas só se ela não estiver já editada
        try:
            await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
        except aiogram.utils.exceptions.MessageNotModified:
            logger.warning("Mensagem não modificada: O conteúdo da mensagem e a marcação são os mesmos.")

        await bot.send_message(call.message.chat.id, f"Grupo {grupo} selecionado! ✅") #retirado reply_to_message_id=call.message.message_id

        prefixo_grupo = "OML" if grupo == "OMNIA" else "ONL"
        lojas = [loja for loja in stores.keys() if loja.startswith(prefixo_grupo)]

        markup = InlineKeyboardMarkup()
        for loja in lojas:
            markup.add(InlineKeyboardButton(loja, callback_data=f"consultar_loja:{loja}"))
        markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
        await bot.send_message(call.message.chat.id, "Selecione a loja que deseja consultar:", reply_markup=markup)
        
        # Iniciar timeout
        asyncio.create_task(set_interaction_timeout(call.message.chat.id))

    except Exception as e:
        logger.error(f"Erro ao processar grupo para consulta: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=call.message.chat.id, text=f"Erro ao processar grupo para consulta: {str(e)}")

async def process_consultar_loja(call: types.CallbackQuery):
    try:
        user_info = get_user_info(call.message)
        loja = call.data.split(":")[1]

        try:
            await call.answer(f"Loja selecionada: {loja} ✅", show_alert=False)
        except InvalidQueryID:
            logger.warning("Query ID inválido ou timeout expirado ao responder à callback query.")

        logger.info(f"Loja selecionada: {loja} por {user_info}")

        await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
        await bot.send_message(call.message.chat.id, f"Loja {loja} selecionada! ✅") #retirado reply_to_message_id=call.message.message_id

        markup = InlineKeyboardMarkup()
        for periodo in PERIODOS:
            markup.add(InlineKeyboardButton(periodo, callback_data=f"periodo:{loja}:{periodo}"))
        markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
        await bot.send_message(call.message.chat.id, "Selecione o período que deseja consultar:", reply_markup=markup)
        
        # Iniciar timeout
        asyncio.create_task(set_interaction_timeout(call.message.chat.id))

    except Exception as e:
        logger.error(f"Erro ao processar loja para consulta: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=call.message.chat.id, text=f"Erro ao processar loja para consulta: {str(e)}")

async def process_periodo_step(call: types.CallbackQuery):
    dados_periodo = call.data.split(":")
    loja = dados_periodo[1]
    periodo = dados_periodo[2]
    user_info = get_user_info(call.message)

    # Verifica se já foi enviado
    if call.message.reply_markup is None:
        return  # Não faz nada se já foi processado

    # Remove a reply_markup e envia a mensagem de confirmação
    try:
        await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
        await bot.send_message(call.message.chat.id, f"Período {periodo} selecionado! ✅") , # reply_to_message_id=call.message.message_id))
    except aiogram.utils.exceptions.MessageNotModified:
        pass

    if periodo == "Customizado":
        user_states[call.message.chat.id] = {'loja': loja, 'step': 'data_hora_inicio'}
        await bot.send_message(call.message.chat.id, "🕒 Insira a data e hora de início (formato: dd-MM-yyyy HH:00):")
    else:
        await processar_periodo(call.message, loja, periodo)
        logger.info(f"Período {periodo} selecionado para a loja {loja} por {user_info}")

async def processar_data_hora_inicio(message: types.Message):
    try:
        user_info = get_user_info(message)
        chat_id = message.chat.id
        if chat_id in user_states and user_states[chat_id]['step'] == 'data_hora_inicio':
            data_hora_inicio = datetime.strptime(message.text, '%d-%m-%Y %H:00')
            user_states[chat_id]['data_hora_inicio'] = data_hora_inicio
            user_states[chat_id]['step'] = 'data_hora_fim'
            await bot.send_message(chat_id=message.chat.id, text=f"✅ Data e hora de início selecionadas: {data_hora_inicio.strftime('%d-%m-%Y %H:00')} ✅")
            await bot.send_message(chat_id=message.chat.id, text="🕒 Insira a data e hora de fim (formato: dd-MM-yyyy HH:00):")
            logger.info(f"Data e hora de início {data_hora_inicio.strftime('%d-%m-%Y %H:00')} selecionadas para a loja {user_states[chat_id]['loja']} por {user_info}")
    except ValueError:
        await bot.send_message(chat_id=message.chat.id, text="❌ Formato de data e hora inválido. Por favor, insira no formato: dd-MM-yyyy HH:00")

async def processar_data_hora_fim(message: types.Message):
    try:
        user_info = get_user_info(message)
        chat_id = message.chat.id
        if chat_id in user_states and user_states[chat_id]['step'] == 'data_hora_fim':
            data_hora_fim = datetime.strptime(message.text, '%d-%m-%Y %H:00') - timedelta(seconds=1)
            data_hora_inicio = user_states[chat_id]['data_hora_inicio']
            loja = user_states[chat_id]['loja']
            user_states[chat_id]['data_hora_fim'] = data_hora_fim
            await bot.send_message(chat_id=message.chat.id, text=f"✅ Data e hora de fim selecionadas: {data_hora_fim.strftime('%d-%m-%Y %H:%M:%S')} ✅")
            await processar_periodo(message, loja, "Customizado", data_hora_inicio, data_hora_fim)
            logger.info(f"Data e hora de fim {data_hora_fim.strftime('%d-%m-%Y %H:%M:%S')} selecionadas para a loja {loja} por {user_info}")
    except ValueError:
        await bot.send_message(chat_id=message.chat.id, text="❌ Formato de data e hora inválido. Por favor, insira no formato: dd-MM-yyyy HH:00")

async def process_periodo_grupo_step(call: types.CallbackQuery):
    try:
        logger.info("process_periodo_grupo_step chamado")
        
        # Dividindo os dados do período
        dados_periodo = call.data.split(":")
        grupo = dados_periodo[1]
        periodo = dados_periodo[2]
        user_info = get_user_info(call.message)

        logger.info(f"Dados do período recebidos: grupo={grupo}, periodo={periodo}, user_info={user_info}")

        # Verifica se a mensagem já foi processada ou se não há markup
        if call.message.text == f"Período {periodo} selecionado! ✅" or call.message.reply_markup is None:
            logger.info("Mensagem já processada ou sem markup, nada a fazer.")
            return  # Não faz nada se já foi processado ou não há markup

        # Remove a reply_markup da mensagem anterior, se presente
        if call.message.reply_markup:
            try:
                await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
                logger.info("Reply_markup removido da mensagem anterior.")
            except aiogram.utils.exceptions.MessageNotModified:
                logger.warning("Mensagem não modificada: O conteúdo da mensagem e a marcação são os mesmos.")

        # Envia a confirmação da seleção de período
        await bot.send_message(chat_id=call.message.chat.id, text=f"Período {periodo} selecionado! ✅")
        logger.info(f"Mensagem de confirmação enviada: Período {periodo} selecionado!")

        # Atualiza o estado do usuário e prossegue conforme o período
        user_states[call.message.chat.id] = {'grupo': grupo}
        logger.info(f"Estado do usuário atualizado com o grupo: {grupo}")

        if periodo == "Customizado":
            # Definir o passo atual como data/hora de início
            user_states[call.message.chat.id]['step'] = 'data_hora_inicio_grupo'
            logger.info(f"Estado do usuário atualizado para 'data_hora_inicio_grupo'")
            await bot.send_message(chat_id=call.message.chat.id, text="🕒 Insira a data e hora de início (formato: dd-MM-yyyy HH:00):")
            logger.info("Solicitação de data e hora de início enviada.")
        else:
            # Se não for customizado, prosseguir com o processamento do período
            await processar_periodo_grupo(call.message, grupo, periodo)
            logger.info(f"Período {periodo} processado para o grupo {grupo} por {user_info}")

    except Exception as e:
        logger.error(f"Erro ao processar período do grupo: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=call.message.chat.id, text=f"Erro ao processar período do grupo: {str(e)}")

async def processar_data_hora_inicio_grupo(message: types.Message):
    chat_id = message.chat.id
    logger.info(f"processar_data_hora_inicio_grupo chamado para chat_id={chat_id}")

    try:
        if chat_id in user_states and user_states[chat_id]['step'] == 'data_hora_inicio_grupo':
            logger.info(f"Estado do usuário encontrado para chat_id={chat_id} com step=data_hora_inicio_grupo")
            
            # Processando a entrada do usuário para data e hora de início
            data_hora_inicio = datetime.strptime(message.text, '%d-%m-%Y %H:00')
            user_states[chat_id]['data_hora_inicio_grupo'] = data_hora_inicio
            user_states[chat_id]['step'] = 'data_hora_fim_grupo'
            logger.info(f"Data e hora de início {data_hora_inicio} registrada para chat_id={chat_id}")
            
            await bot.send_message(chat_id=message.chat.id, text=f"✅ Data e hora de início selecionadas: {data_hora_inicio.strftime('%d-%m-%Y %H:00')} ✅")
            logger.info("Confirmação de data e hora de início enviada.")
            
            await bot.send_message(chat_id=message.chat.id, text="🕒 Insira a data e hora de fim (formato: dd-MM-yyyy HH:00):")
            logger.info("Solicitação de data e hora de fim enviada.")
        else:
            logger.warning(f"Estado do usuário não encontrado ou step incorreto para chat_id={chat_id}")

    except ValueError:
        logger.error(f"Formato inválido inserido para chat_id={chat_id}: {message.text}")
        await bot.send_message(chat_id=message.chat.id, text="❌ Formato inválido. Tente novamente no formato: dd-MM-yyyy HH:00")

async def processar_data_hora_fim_grupo(message: types.Message):
    chat_id = message.chat.id
    logger.info(f"processar_data_hora_fim_grupo chamado para o chat_id: {chat_id}")

    try:
        # Verifica se o chat está no estado correto para processar a data de fim
        if chat_id in user_states:
            logger.info(f"Estado atual do chat {chat_id}: {user_states[chat_id]}")
        else:
            logger.warning(f"Chat ID {chat_id} não encontrado em user_states")

        if chat_id in user_states and user_states[chat_id]['step'] == 'data_hora_fim_grupo':
            logger.info(f"Processando data e hora de fim para chat_id: {chat_id}")
            try:
                # Tenta converter a data e hora inserida pelo usuário
                data_hora_fim = datetime.strptime(message.text, '%d-%m-%Y %H:00')
                logger.info(f"Data e hora de fim válida recebida: {data_hora_fim}")
            except ValueError:
                logger.error(f"Formato de data e hora inválido recebido: {message.text}")
                # Se o formato estiver incorreto, envia uma mensagem de erro
                await bot.send_message(chat_id=message.chat.id, text="❌ Formato inválido. Tente novamente no formato: dd-MM-yyyy HH:00")
                return

            # Atualiza o estado com a data e hora de fim
            user_states[chat_id]['data_hora_fim_grupo'] = data_hora_fim
            logger.info(f"Data e hora de fim atualizada no estado: {user_states[chat_id]}")

            grupo = user_states[chat_id].get('grupo')

            if grupo:
                logger.info(f"Iniciando processamento do período customizado para o grupo: {grupo}")
                await bot.send_message(chat_id=message.chat.id, text=f"✅ Data e hora de fim selecionadas: {data_hora_fim.strftime('%d-%m-%Y %H:00')} ✅")
                await processar_periodo_grupo(message, grupo, "Customizado", inicio=user_states[chat_id]['data_hora_inicio_grupo'], fim=data_hora_fim)
            else:
                logger.error(f"Grupo não encontrado no estado para chat_id: {chat_id}")
                await bot.send_message(chat_id=message.chat.id, text="❌ Grupo não encontrado. Por favor, selecione um grupo primeiro.")
        else:
            logger.warning(f"Chat ID {chat_id} não está no estado 'data_hora_fim_grupo'. Estado atual: {user_states.get(chat_id, 'N/A')}")
    except Exception as e:
        logger.error(f"Erro ao processar data e hora de fim para chat_id {chat_id}: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=message.chat.id, text="⚠️ Ocorreu um erro. Tente novamente.")

async def processar_data_hora_inicio_grupo(message: types.Message):
    chat_id = message.chat.id
    logger.info(f"processar_data_hora_inicio_grupo chamado para chat_id={chat_id}")

    try:
        if chat_id in user_states and user_states[chat_id]['step'] == 'data_hora_inicio_grupo':
            logger.info(f"Estado do usuário encontrado para chat_id={chat_id} com step=data_hora_inicio_grupo")
            
            # Processando a entrada do usuário para data e hora de início
            data_hora_inicio = datetime.strptime(message.text, '%d-%m-%Y %H:00')
            user_states[chat_id]['data_hora_inicio_grupo'] = data_hora_inicio
            user_states[chat_id]['step'] = 'data_hora_fim_grupo'
            logger.info(f"Data e hora de início {data_hora_inicio} registrada para chat_id={chat_id}")
            
            await bot.send_message(chat_id=message.chat.id, text=f"✅ Data e hora de início selecionadas: {data_hora_inicio.strftime('%d-%m-%Y %H:00')} ✅")
            logger.info("Confirmação de data e hora de início enviada.")
            
            await bot.send_message(chat_id=message.chat.id, text="🕒 Insira a data e hora de fim (formato: dd-MM-yyyy HH:00):")
            logger.info("Solicitação de data e hora de fim enviada.")
        else:
            logger.warning(f"Estado do usuário não encontrado ou step incorreto para chat_id={chat_id}")

    except ValueError:
        logger.error(f"Formato inválido inserido para chat_id={chat_id}: {message.text}")
        await bot.send_message(chat_id=message.chat.id, text="❌ Formato inválido. Tente novamente no formato: dd-MM-yyyy HH:00")

async def processar_data_hora_fim_grupo(message: types.Message):
    chat_id = message.chat.id
    logger.info(f"processar_data_hora_fim_grupo chamado para o chat_id: {chat_id}")

    try:
        # Verifica se o chat está no estado correto para processar a data de fim
        if chat_id in user_states:
            logger.info(f"Estado atual do chat {chat_id}: {user_states[chat_id]}")
        else:
            logger.warning(f"Chat ID {chat_id} não encontrado em user_states")

        if chat_id in user_states and user_states[chat_id]['step'] == 'data_hora_fim_grupo':
            logger.info(f"Processando data e hora de fim para chat_id: {chat_id}")
            try:
                # Tenta converter a data e hora inserida pelo usuário
                data_hora_fim = datetime.strptime(message.text, '%d-%m-%Y %H:00')
                logger.info(f"Data e hora de fim válida recebida: {data_hora_fim}")
            except ValueError:
                logger.error(f"Formato de data e hora inválido recebido: {message.text}")
                # Se o formato estiver incorreto, envia uma mensagem de erro
                await bot.send_message(chat_id=message.chat.id, text="❌ Formato inválido. Tente novamente no formato: dd-MM-yyyy HH:00")
                return

            # Atualiza o estado com a data e hora de fim
            user_states[chat_id]['data_hora_fim_grupo'] = data_hora_fim
            logger.info(f"Data e hora de fim atualizada no estado: {user_states[chat_id]}")

            grupo = user_states[chat_id].get('grupo')

            if grupo:
                logger.info(f"Iniciando processamento do período customizado para o grupo: {grupo}")
                await bot.send_message(chat_id=message.chat.id, text=f"✅ Data e hora de fim selecionadas: {data_hora_fim.strftime('%d-%m-%Y %H:00')} ✅")
                await processar_periodo_grupo(message, grupo, "Customizado", inicio=user_states[chat_id]['data_hora_inicio_grupo'], fim=data_hora_fim)
            else:
                logger.error(f"Grupo não encontrado no estado para chat_id: {chat_id}")
                await bot.send_message(chat_id=message.chat.id, text="❌ Grupo não encontrado. Por favor, selecione um grupo primeiro.")
        else:
            logger.warning(f"Chat ID {chat_id} não está no estado 'data_hora_fim_grupo'. Estado atual: {user_states.get(chat_id, 'N/A')}")
    except Exception as e:
        logger.error(f"Erro ao processar data e hora de fim para chat_id {chat_id}: {str(e)}", exc_info=True)
        await bot.send_message(chat_id=message.chat.id, text="⚠️ Ocorreu um erro. Tente novamente.")

from aiogram.utils.exceptions import MessageNotModified

async def processar_nova_consulta_lojas(call: types.CallbackQuery):
    try:
        user_info = get_user_info(call.message)
        logger.info(f"Nova consulta solicitada por {user_info}")

        # Tentar remover o markup anterior
        if call.message.reply_markup is not None:
            try:
                await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
            except aiogram.utils.exceptions.MessageNotModified:
                logger.warning(f"Mensagem {call.message.message_id} já não tinha markup ou não pôde ser modificada.")

        # Chamar o menu de consultas
        await menu_consultas(call)
    except Exception as e:
        logger.error(f"Erro ao processar nova consulta: {str(e)}", exc_info=True)
        await bot.send_message(call.message.chat.id, "⚠️ Houve um problema ao iniciar uma nova consulta. Por favor, utilize /consultar para reiniciar o processo.")

async def processar_nova_consulta_grupo(call: types.CallbackQuery):
    try:
        user_info = get_user_info(call.message)
        logger.info(f"Nova consulta solicitada para grupo por {user_info}")

        # Verifique se a mensagem já está sem marcação antes de tentar removê-la
        if call.message.reply_markup is not None:
            try:
                await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
            except aiogram.utils.exceptions.MessageNotModified:
                logger.warning(f"Mensagem não modificada: O conteúdo da mensagem e a marcação são os mesmos.")
            except Exception as e:
                logger.error(f"Erro ao remover reply_markup: {str(e)}", exc_info=True)

        # Chamar o menu de consultas
        await menu_consultas(call)
    except Exception as e:
        logger.error(f"Erro ao processar nova consulta para grupo: {str(e)}", exc_info=True)
        await bot.send_message(call.message.chat.id, "⚠️ Houve um problema ao iniciar uma nova consulta. Por favor, utilize /consultargrupo para reiniciar o processo.")

async def processar_periodo(call_or_message, loja, periodo, inicio=None, fim=None):
    mensagem_carregando = None
    chat_id = call_or_message.chat.id
    message_id = call_or_message.message_id

    try:
        user_info = get_user_info(call_or_message)
        
        now = datetime.now()
        if periodo == "Customizado" and inicio and fim:
            # Supondo que você já tenha as variáveis inicio e fim definidas em algum lugar do código
            inicio_customizado = inicio  # Use o valor de 'inicio' passado como argumento
            fim_customizado = fim        # Use o valor de 'fim' passado como argumento

            # Agora chame a função obter_datas_comparacao
            inicio, fim, inicio_lp, fim_lp = obter_datas_comparacao(
                periodo="Customizado",
                now=now,
                inicio_customizado=inicio_customizado,
                fim_customizado=fim_customizado
            )
        else:
            inicio, fim, inicio_lp, fim_lp = obter_datas_comparacao(periodo, now)
        
        logger.info(f"Período selecionado: {periodo} para a loja {loja} por {user_info}")

        try:
            await bot.edit_message_reply_markup(chat_id, message_id, reply_markup=None)
        except:
            logger.warning(f"Não foi possível editar a mensagem: {message_id}")

        mensagem_carregando = await bot.send_message(chat_id, "⏳ A carregar os dados, aguarde um momento, por favor.")

        resultados_atuais, resultados_anteriores = comparar_periodo_anterior(loja, inicio, fim, now)

        # Calcular a percentagem de ocupação das regiões para o período atual e anterior
        ocupacao_atual = calcular_percentagem_ocupacao(loja, inicio, fim)
        ocupacao_anterior = calcular_percentagem_ocupacao(loja, inicio_lp, fim_lp)

        # Obter as duas regiões mais ocupadas com base no período atual
        top_2_ocupacao_atual = calcular_top_2_regioes_ocupadas(ocupacao_atual)
        # Obter as duas regiões menos ocupadas com base no período atual
        menos_2_ocupacao_atual = calcular_menos_2_regioes_ocupadas(ocupacao_atual)


        # Comparar com as mesmas regiões no período anterior
        top_2_ocupacao_anterior = {regiao: ocupacao_anterior.get(regiao, 0) for regiao, _ in top_2_ocupacao_atual}
        menos_2_ocupacao_anterior = {regiao: ocupacao_anterior.get(regiao, 0) for regiao, _ in menos_2_ocupacao_atual}

        # Log para verificar se ocupacao_regioes está presente nos resultados
        logger.info(f"Resultados atuais: {resultados_atuais}")
        logger.info(f"Resultados anteriores: {resultados_anteriores}")
        logger.info(f"Ocupação atual: {ocupacao_atual}")
        logger.info(f"Ocupação anterior: {ocupacao_anterior}")
        logger.info(f"Top 2 ocupação atual: {top_2_ocupacao_atual}")
        logger.info(f"Menos 2 ocupação atual: {menos_2_ocupacao_atual}")

        # Determina a saudação baseada na hora atual
        hora_atual = datetime.now().hour
        if 6 <= hora_atual < 12:
            saudacao = "Bom dia"
        elif 12 <= hora_atual < 19:
            saudacao = "Boa tarde"
        else:
            saudacao = "Boa noite"

        # Extrai o username de user_info
        username = escape_md(user_info.split(':')[1].split(',')[0].strip())

        # Cria a mensagem de resposta
        resposta = f"{saudacao}, {username}!\n"
        resposta += f"Segue abaixo um resumo detalhado do desempenho da loja {loja}, considerando o período de {inicio.strftime('%d/%m/%Y %H:%M')} a {fim.strftime('%d/%m/%Y %H:%M')}:\n\n"

        resposta += "**Principais Indicadores de Desempenho**:\n"
        resposta += mostrar_resultados(resultados_atuais['total_vendas_com_iva'], resultados_anteriores['total_vendas_com_iva'], "Total de Vendas (com IVA)", monetario=True) + "\n"
        resposta += mostrar_resultados(resultados_atuais['total_vendas_sem_iva'], resultados_anteriores['total_vendas_sem_iva'], "Total de Vendas (sem IVA)", monetario=True) + "\n"
        resposta += mostrar_resultados(resultados_atuais['transacoes_vendas'], resultados_anteriores['transacoes_vendas'], "Transações") + "\n"
        resposta += mostrar_resultados(resultados_atuais['visitantes'], resultados_anteriores['visitantes'], "Visitantes") + "\n"
        resposta += mostrar_resultados_percentual(resultados_atuais['taxa_conversao'], resultados_anteriores['taxa_conversao'], "Taxa de Conversão") + "\n"
        resposta += mostrar_resultados_minutos(resultados_atuais['tempo_medio_permanencia'], resultados_anteriores['tempo_medio_permanencia'], "Tempo Médio de Permanência") + "\n"
        resposta += mostrar_resultados(resultados_atuais['total_passagens'], resultados_anteriores['total_passagens'], "Número de Passagens") + "\n"
        resposta += mostrar_resultados_percentual(resultados_atuais['entry_rate'], resultados_anteriores['entry_rate'], "Taxa de Captação") + "\n"

        if top_2_ocupacao_atual:
            resposta += "\n**Áreas de Maior Ocupação (Hot Spots)**:\n"
            for regiao, percentagem in top_2_ocupacao_atual:
                resposta += mostrar_resultados_ocupacao(percentagem, top_2_ocupacao_anterior.get(regiao, 0), regiao) + "\n"

        if menos_2_ocupacao_atual:
            resposta += "\n**Áreas de Menor Ocupação (Cold Spots)**:\n"
            for regiao, percentagem in menos_2_ocupacao_atual:
                resposta += mostrar_resultados_ocupacao(percentagem, menos_2_ocupacao_anterior.get(regiao, 0), regiao) + "\n"

        resposta += "\n**Principais Indicadores de Eficiência**:\n"
        resposta += mostrar_resultados(resultados_atuais['ticket_medio_com_iva'], resultados_anteriores['ticket_medio_com_iva'], "Ticket Médio (com IVA)", monetario=True) + "\n"
        resposta += mostrar_resultados(resultados_atuais['ticket_medio_sem_iva'], resultados_anteriores['ticket_medio_sem_iva'], "Ticket Médio (sem IVA)", monetario=True) + "\n"
        resposta += mostrar_resultados_unidades(resultados_atuais['unidades_por_transacao'], resultados_anteriores['unidades_por_transacao'], "Unidades por Transação") + "\n"
        resposta += mostrar_resultados_devolucoes(resultados_atuais['indice_devolucoes'], resultados_anteriores['indice_devolucoes'], "Índice de Devoluções") + "\n"
        resposta += mostrar_resultados_descontos(resultados_atuais['indice_descontos'], resultados_anteriores['indice_descontos'], "Índice de Descontos") + "\n"

        resposta += "\n**Top Vendedores (sem IVA)**:\n"
        for i, (vendedor, valor) in enumerate(resultados_atuais['top_vendedores'], start=1):
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉"
            resposta += f"{medal} {vendedor}: €{valor:.0f}\n"

        resposta += "\n**Top Produtos (Quantidade Vendida)**:\n"
        for item, descritivo, quantidade in resultados_atuais['top_produtos']:
            resposta += f"- {descritivo} ({item}): {quantidade:.0f} unidades\n"

        resposta += "\n**Última Atualização dos Dados**:\n"
        resposta += f"{resultados_atuais['ultima_coleta'].strftime('%d/%m/%Y %H:%M')}\n"

        resposta += "\n**Período de Comparação**:\n"
        resposta += f"{inicio_lp.strftime('%d/%m/%Y %H:%M')} a {fim_lp.strftime('%d/%m/%Y %H:%M')}\n"
  
        resposta = escape_md(resposta)

        await asyncio.sleep(3)
        if mensagem_carregando:
            await bot.delete_message(chat_id, mensagem_carregando.message_id)
        await bot.send_message(chat_id, resposta, parse_mode='MarkdownV2')

        markup = InlineKeyboardMarkup()
        markup.add(InlineKeyboardButton("Mapa de Calor", callback_data=f"heatmap:{loja}:{periodo}"))
        markup.add(InlineKeyboardButton("Nova Consulta", callback_data="nova_consulta_lojas"))
        markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
        await bot.send_message(chat_id, "📊 Deseja obter o Mapa de Calor para este período ou iniciar uma nova consulta?", reply_markup=markup)
    except Exception as e:
        logger.error(f"Erro ao processar período: {str(e)}", exc_info=True)
        await asyncio.sleep(3)
        if mensagem_carregando:
            await bot.delete_message(chat_id, mensagem_carregando.message_id)
        await bot.send_message(chat_id, "⚠️ Houve um problema. Por favor, utilize /consultar para reiniciar o processo.")

async def processar_periodo_grupo(call_or_message, grupo, periodo, inicio=None, fim=None):
    mensagem_carregando = None
    chat_id = call_or_message.chat.id
    message_id = call_or_message.message_id
    session = Session()

    try:
        user_info = get_user_info(call_or_message)
        
        now = datetime.now()
        if periodo == "Customizado" and inicio and fim:
            # Utilize as datas de início e fim fornecidas como argumentos
            inicio_customizado = inicio
            fim_customizado = fim

            # Obter as datas comparativas com base no período customizado
            inicio, fim, inicio_lp, fim_lp = obter_datas_comparacao(
                periodo="Customizado",
                now=now,
                inicio_customizado=inicio_customizado,
                fim_customizado=fim_customizado
            )
        else:
            # Para outros períodos, calcular as datas automaticamente
            inicio, fim, inicio_lp, fim_lp = obter_datas_comparacao(periodo, now)

        logger.info(f"Período selecionado: {periodo} para o grupo {grupo} por {user_info}")

        # Remover a marcação de resposta enquanto processa os dados
        try:
            await bot.edit_message_reply_markup(chat_id, message_id, reply_markup=None)
        except:
            logger.warning(f"Não foi possível editar a mensagem: {message_id}")

        mensagem_carregando = await bot.send_message(chat_id, "⏳ A carregar os dados, aguarde um momento, por favor.")

        prefixo_grupo = "OML" if grupo == "OMNIA" else "ONL"
        lojas = [loja for loja in stores.keys() if loja.startswith(prefixo_grupo)]

        # Inicializar os dicionários para armazenar dados agregados
        dados_agregados = {
            'total_vendas_com_iva': 0,
            'total_vendas_sem_iva': 0,
            'transacoes_vendas': 0,
            'visitantes': 0,
            'taxa_conversao': 0,
            'tempo_medio_permanencia': 0,
            'ticket_medio_com_iva': 0,
            'ticket_medio_sem_iva': 0,
            'unidades_por_transacao': 0,
            'indice_devolucoes': 0,
            'indice_descontos': 0,
            'entry_rate': 0,
            'top_vendedores': [],
            'top_produtos': [],
            'ultima_coleta': None,
            'line4_in': 0,
            'line4_out': 0,
            'total_passagens': 0,
            'ocupacao_regioes': {},
        }

        dados_agregados_anteriores = {
            'total_vendas_com_iva': 0,
            'total_vendas_sem_iva': 0,
            'transacoes_vendas': 0,
            'visitantes': 0,
            'taxa_conversao': 0,
            'tempo_medio_permanencia': 0,
            'ticket_medio_com_iva': 0,
            'ticket_medio_sem_iva': 0,
            'unidades_por_transacao': 0,
            'indice_devolucoes': 0,
            'indice_descontos': 0,
            'entry_rate': 0,
            'top_vendedores': [],
            'top_produtos': [],
            'ultima_coleta': None,
            'line4_in': 0,
            'line4_out': 0,
            'total_passagens': 0,
            'ocupacao_regioes': {},
        }

        # Processamento das lojas do grupo para obter os dados agregados
        for loja in lojas:
            resultados_atuais, resultados_anteriores = comparar_periodo_anterior(loja, inicio, fim, now)
            for key, value in resultados_atuais.items():
                if key in dados_agregados:
                    if isinstance(value, list):
                        dados_agregados[key].extend(value)
                    elif isinstance(value, dict):
                        for subkey, subvalue in value.items():
                            if subkey in dados_agregados[key]:
                                dados_agregados[key][subkey] += subvalue
                            else:
                                dados_agregados[key][subkey] = subvalue
                    elif isinstance(value, (int, float)):
                        dados_agregados[key] += value
                    elif isinstance(value, datetime):
                        if dados_agregados[key] is None or value > dados_agregados[key]:
                            dados_agregados[key] = value
                    else:
                        logger.warning(f"Tipo de dado não suportado para agregação: {type(value)} para chave {key}")

            for key, value in resultados_anteriores.items():
                if key in dados_agregados_anteriores:
                    if isinstance(value, list):
                        dados_agregados_anteriores[key].extend(value)
                    elif isinstance(value, dict):
                        for subkey, subvalue in value.items():
                            if subkey in dados_agregados_anteriores[key]:
                                dados_agregados_anteriores[key][subkey] += subvalue
                            else:
                                dados_agregados_anteriores[key][subkey] = subvalue
                    elif isinstance(value, (int, float)):
                        dados_agregados_anteriores[key] += value
                    elif isinstance(value, datetime):
                        if dados_agregados_anteriores[key] is None or value > dados_agregados_anteriores[key]:
                            dados_agregados_anteriores[key] = value
                    else:
                        logger.warning(f"Tipo de dado não suportado para agregação: {type(value)} para chave {key}")

        # Cálculo dos melhores vendedores e produtos mais vendidos
        vendedores_agrupados = {}
        for vendedor, valor in dados_agregados['top_vendedores']:
            if vendedor in vendedores_agrupados:
                vendedores_agrupados[vendedor] += valor
            else:
                vendedores_agrupados[vendedor] = valor
        top_vendedores_agrupados = sorted(vendedores_agrupados.items(), key=lambda x: x[1], reverse=True)[:3]

        produtos_agrupados = {}
        for item, descritivo, quantidade in dados_agregados['top_produtos']:
            if item in produtos_agrupados:
                produtos_agrupados[item]['quantidade'] += quantidade
            else:
                produtos_agrupados[item] = {'descritivo': descritivo, 'quantidade': quantidade}
        top_produtos_agrupados = sorted(produtos_agrupados.items(), key=lambda x: x[1]['quantidade'], reverse=True)[:5]

        # Determina a saudação baseada na hora atual
        hora_atual = datetime.now().hour
        if 6 <= hora_atual < 12:
            saudacao = "Bom dia"
        elif 12 <= hora_atual < 19:
            saudacao = "Boa tarde"
        else:
            saudacao = "Boa noite"

        # Extrai o username de user_info
        username = escape_md(user_info.split(':')[1].split(',')[0].strip())

        # Preparar a resposta agregada para o usuário
        resposta = f"{saudacao}, {username}!\n\n"
        resposta += f"Segue abaixo um resumo consolidado para o grupo {grupo}, abrangendo o período de {inicio.strftime('%d/%m/%Y %H:%M')} a {fim.strftime('%d/%m/%Y %H:%M')}:\n\n"

        resposta += f"**Principais Indicadores de Desempenho:** \n\n"
        resposta += mostrar_resultados(dados_agregados['total_vendas_com_iva'], dados_agregados_anteriores['total_vendas_com_iva'], "Total de Vendas (c/ IVA)", monetario=True) + "\n"
        resposta += mostrar_resultados(dados_agregados['total_vendas_sem_iva'], dados_agregados_anteriores['total_vendas_sem_iva'], "Total de Vendas (s/ IVA)", monetario=True) + "\n"
        resposta += mostrar_resultados(dados_agregados['transacoes_vendas'], dados_agregados_anteriores['transacoes_vendas'], "Transações") + "\n"
        resposta += mostrar_resultados(dados_agregados['visitantes'], dados_agregados_anteriores['visitantes'], "Visitantes") + "\n"
        resposta += mostrar_resultados_percentual(dados_agregados['taxa_conversao'], dados_agregados_anteriores['taxa_conversao'], "Taxa de Conversão") + "\n"
        resposta += mostrar_resultados_minutos(dados_agregados['tempo_medio_permanencia'], dados_agregados_anteriores['tempo_medio_permanencia'], "Tempo Médio de Permanência") + "\n"
        resposta += mostrar_resultados(dados_agregados['total_passagens'], dados_agregados_anteriores['total_passagens'], "Número de Passagens") + "\n"
        resposta += mostrar_resultados_percentual(dados_agregados['entry_rate'], dados_agregados_anteriores['entry_rate'], "Taxa de Captação") + "\n"
        
        resposta += "\n**Principais Indicadores de Eficiência:** \n"
        resposta += mostrar_resultados(dados_agregados['ticket_medio_com_iva'], dados_agregados_anteriores['ticket_medio_com_iva'], "Ticket Médio (c/ IVA)", monetario=True) + "\n"
        resposta += mostrar_resultados(dados_agregados['ticket_medio_sem_iva'], dados_agregados_anteriores['ticket_medio_sem_iva'], "Ticket Médio (s/ IVA)", monetario=True) + "\n"
        resposta += mostrar_resultados_unidades(dados_agregados['unidades_por_transacao'], dados_agregados_anteriores['unidades_por_transacao'], "Unidades por Transação") + "\n"
        resposta += mostrar_resultados_devolucoes(dados_agregados['indice_devolucoes'], dados_agregados_anteriores['indice_devolucoes'], "Índice de Devoluções") + "\n"
        resposta += mostrar_resultados_descontos(dados_agregados['indice_descontos'], dados_agregados_anteriores['indice_descontos'], "Índice de Descontos") + "\n"
        
        resposta += "\n**Top Vendedores (s/IVA)**: \n"
        for i, (vendedor, valor) in enumerate(top_vendedores_agrupados, start=1):
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉"
            resposta += f"{medal} {escape_md(vendedor)}: €{valor:.0f}" + "\n"

        resposta += "\n**Top Produtos (Qtd)**:\n"
        for item, descritivo, quantidade in resultados_atuais['top_produtos']:
            resposta += f"- {descritivo} ({item}): {quantidade:.0f} u.\n"

        resposta += "\nÚltima atualização dos dados:\n"
        resposta += f"{resultados_atuais['ultima_coleta'].strftime('%Y-%m-%d %H:%M')}\n\n"

        resposta += "Período de comparação:\n"
        resposta += f"{inicio_lp.strftime('%Y-%m-%d %H:%M')} a {fim_lp.strftime('%Y-%m-%d %H:%M')}\n"

        resposta = escape_md(resposta)

        await asyncio.sleep(3)
        if mensagem_carregando:
            await bot.delete_message(chat_id, mensagem_carregando.message_id)
        await bot.send_message(chat_id, resposta, parse_mode='MarkdownV2')

        # Adicionar botões de Nova Consulta e Sair
        markup = InlineKeyboardMarkup()
        markup.add(InlineKeyboardButton("Nova Consulta", callback_data="nova_consulta_grupo"))
        markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
        await bot.send_message(chat_id, "Deseja iniciar uma nova consulta ou sair?", reply_markup=markup)

    except Exception as e:
        logger.error(f"Erro ao processar grupo para consulta de agregado: {str(e)}", exc_info=True)
        await asyncio.sleep(3)
        if mensagem_carregando:
            await bot.delete_message(chat_id, mensagem_carregando.message_id)
        await bot.send_message(chat_id, "⚠️ Houve um problema. Por favor, utilize /consultargrupo para reiniciar o processo.")
    finally:
        session.close()

async def cancelar_consulta(call: types.CallbackQuery):
    try:
        user_info = get_user_info(call.message)

        # Remove os botões da mensagem anterior
        try:
            await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
        except aiogram.utils.exceptions.MessageNotModified:
            logger.warning(f"Mensagem já estava sem markup ou não pôde ser modificada: {call.message.message_id}")
        
        await call.answer("❌ Consulta cancelada pelo utilizador")
        logger.info(f"Consulta cancelada pelo usuário {user_info}")

        # Retorna ao menu inicial
        await bot.send_message(call.message.chat.id, "❌ Consulta cancelada. Utilize /consultar para iniciar nova consulta ou /funcoes para listar todas as opções.")
    except Exception as e:
        logger.error(f"Erro ao cancelar consulta: {str(e)}", exc_info=True)
        await bot.send_message(call.message.chat.id, f"Erro ao cancelar consulta: {str(e)}")

async def process_heatmap_choice(call: types.CallbackQuery):
    try:
        _, loja, periodo = call.data.split(":")
    except ValueError:
        logger.error(f"Callback data format error: {call.data}")
        await bot.send_message(chat_id=call.message.chat.id, text="⚠️ Formato de dados inválido. Por favor, utilize /consultar para tentar novamente.")
        return

    mensagem_carregando_heatmap = None
    user_info = get_user_info(call.message)
    try:
        await call.answer(f"Opção selecionada: Heatmap")
        logger.info(f"Opção selecionada: Heatmap para a loja {loja}, período {periodo} por {user_info}")

        # Tente remover o markup, mas ignore o erro se não for possível
        try:
            await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
        except aiogram.utils.exceptions.MessageNotModified:
            logger.warning(f"Mensagem já estava sem markup ou não pôde ser modificada: {call.message.message_id}")
        except Exception as e:
            logger.error(f"Erro inesperado ao tentar modificar o markup: {str(e)}")

        mensagem_carregando_heatmap = await bot.send_message(call.message.chat.id, "🌡️ A gerar os mapas de calor, por favor aguarde um momento.")
        
        if periodo == "Customizado":
            datas = user_states.get(call.message.chat.id, {})
            inicio, fim = datas.get('data_hora_inicio'), datas.get('data_hora_fim')
            if not (inicio and fim):
                await bot.send_message(call.message.chat.id, "⚠️ Período customizado inválido. Utilize /consultar para tentar novamente.")
                return
        else:
            inicio, fim, _, _ = obter_datas(periodo)

        now = datetime.now()
        if fim > now:
            fim = now

        sub_type = 1 if periodo in ["Hoje", "Ontem"] else 2 if periodo == "Esta Semana" else 3

        ip_addresses = stores.get(loja, [])
        for ip in ip_addresses:
            heatmap_image = generate_heatmap(ip, inicio.strftime('%Y-%m-%d-%H-%M-%S'), fim.strftime('%Y-%m-%d-%H-%M-%S'), sub_type)
            if heatmap_image:
                await bot.send_photo(call.message.chat.id, heatmap_image)
                heatmap_image.close()
            else:
                await bot.send_message(call.message.chat.id, f"⚠️ Não foi possível gerar o mapa de calor para o IP: {ip}")

        if mensagem_carregando_heatmap:
            await bot.delete_message(call.message.chat.id, mensagem_carregando_heatmap.message_id)

        markup = InlineKeyboardMarkup()
        markup.add(InlineKeyboardButton("Nova Consulta", callback_data="nova_consulta_lojas"))
        markup.add(InlineKeyboardButton("Sair", callback_data="sair_para_inicial"))
        await bot.send_message(chat_id=call.message.chat.id, text="✅ Processo concluído. Deseja iniciar uma nova consulta ou sair?", reply_markup=markup)
    except Exception as e:
        logger.error(f"Erro ao processar escolha do heatmap: {str(e)}", exc_info=True)
        if mensagem_carregando_heatmap:
            await bot.delete_message(call.message.chat.id, mensagem_carregando_heatmap.message_id)
        await bot.send_message(chat_id=call.message.chat.id, text="⚠️ Houve um problema ao processar sua escolha. Por favor, utilize /consultar para reiniciar o processo.")

def consultar_dados_acumulados(loja, inicio, fim):
    session = Session()
    try:
        dados = session.query(
            func.strftime('%Y-%m-%d %H:00:00', PeopleCountingData.start_time).label('hora'),
            func.sum(PeopleCountingData.line1_in + PeopleCountingData.line2_in + PeopleCountingData.line3_in).label('visitantes'),
            func.sum(PeopleCountingData.total_in).label('conversoes')
        ).filter(
            PeopleCountingData.loja == loja,
            PeopleCountingData.start_time >= inicio,
            PeopleCountingData.end_time <= fim
        ).group_by(
            func.strftime('%Y-%m-%d %H:00:00', PeopleCountingData.start_time)
        ).all()
        
        resultados = [{'hora': dado.hora, 'visitantes': dado.visitantes, 'conversoes': dado.conversoes} for dado in dados]
        return resultados
    except Exception as e:
        logger.error(f"Erro ao buscar dados acumulados: {str(e)}", exc_info=True)
        return []
    finally:
        session.close()

async def process_flow_choice(call: types.CallbackQuery):
    try:
        data_parts = call.data.split(":")
        if len(data_parts) != 4:
            raise ValueError("Callback data format error")

        _, choice, loja, periodo = data_parts
        mensagem_carregando_fluxo = None
        user_info = get_user_info(call.message)

        await call.answer(f"Opção selecionada: {choice}")
        logger.info(f"Opção selecionada: {choice} para o gráfico de fluxo da loja {loja}, período {periodo} por {user_info}")

        await bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)

        mensagem_carregando_fluxo = await bot.send_message(call.message.chat.id, "📈 A gerar o gráfico de fluxo, por favor aguarde um momento.")
        
        if periodo == "Customizado":
            datas = user_states.get(call.message.chat.id, {})
            inicio, fim = datas.get('data_hora_inicio'), datas.get('data_hora_fim')
            if not (inicio and fim):
                await bot.send_message(call.message.chat.id, "⚠️ Período customizado inválido. Utilize /consultar para tentar novamente.")
                return
        else:
            inicio, fim, _, _ = obter_datas(periodo)

        dados = consultar_dados_acumulados(loja, inicio, fim)

        if not dados:
            if mensagem_carregando_fluxo:
                await bot.delete_message(call.message.chat.id, mensagem_carregando_fluxo.message_id)
            await bot.send_message(call.message.chat.id, "⚠️ Não há dados disponíveis para gerar o gráfico de fluxo.")
            return

        horas = [dado['hora'] for dado in dados]
        visitantes = [dado['visitantes'] for dado in dados]
        conversoes = [dado['conversoes'] for dado in dados]

        fig, ax1 = plt.subplots()

        cor_barras = 'tab:blue'
        ax1.set_xlabel('Hora do Dia')
        ax1.set_ylabel('Visitantes', color=cor_barras)
        ax1.bar(horas, visitantes, color=cor_barras, label='Visitantes')
        ax1.tick_params(axis='y', labelcolor=cor_barras)

        ax2 = ax1.twinx()
        cor_linha = 'tab:red'
        ax2.set_ylabel('Taxa de Conversão (%)', color=cor_linha)
        ax2.plot(horas, conversoes, color=cor_linha, label='Taxa de Conversão (%)')
        ax2.tick_params(axis='y', labelcolor=cor_linha)

        fig.tight_layout()
        plt.title(f"Gráfico de Fluxo - Loja {loja} - Período {periodo}")
        ax1.legend(loc='upper left')
        ax2.legend(loc='upper right')

        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plt.close(fig)

        if mensagem_carregando_fluxo:
            await bot.delete_message(call.message.chat.id, mensagem_carregando_fluxo.message_id)
        await bot.send_photo(call.message.chat.id, buf)
        buf.close()
        await bot.send_message(call.message.chat.id, "✅ Processo concluído. Utilize /consultar para iniciar uma nova consulta.")
    except ValueError as ve:
        logger.error(f"Callback data format error: {call.data} - {ve}")
        await bot.send_message(call.message.chat.id, "⚠️ Formato de dados inválido. Por favor, utilize /consultar para tentar novamente.")
    except Exception as e:
        logger.error(f"Erro ao processar escolha do gráfico de fluxo: {str(e)}", exc_info=True)
        if mensagem_carregando_fluxo:
            await bot.delete_message(call.message.chat.id, mensagem_carregando_fluxo.message_id)
        await bot.send_message(call.message.chat.id, "⚠️ Houve um problema ao processar sua escolha. Por favor, utilize /consultar para reiniciar o processo.")

async def enviar_mensagem_reinicio(chat_id):
    await bot.send_message(chat_id, "🔄 Vamos retomar a conversa! Use /consultar para iniciar uma nova consulta ou /help para obter instruções. 😃")

async def enviar_mensagem_desligamento(chat_id):
    await bot.send_message(chat_id, "⚠️ Estamos temporariamente offline para melhorar a nossa ferramenta e trazer novas funcionalidades. Ser-lhe-á notificado quando estivermos de volta. Até breve! 🚀✨")

def signal_handler(sig, frame):
    last_chat_id = get_last_chat_id()
    if last_chat_id:
        loop = asyncio.get_event_loop()
        loop.create_task(enviar_mensagem_desligamento(last_chat_id))
    logger.info("Bot desligado")
    loop.stop()

async def set_commands(bot: Bot):
    commands = [
        BotCommand(command="/start", description="Inicia o bot"),
        BotCommand(command="/help", description="Mostra as instruções"),
        BotCommand(command="/consultar", description="Inicia uma consulta de vendas por loja"),
        BotCommand(command="/consultargrupo", description="Inicia uma consulta de dados agregados por grupo"),
        BotCommand(command="/exportardados", description="Exporta os dados em um arquivo Excel"),
        BotCommand(command="/registo", description="Regista um novo utilizador usando um código de convite"),
        BotCommand(command="/gerarconvite", description="Gera um convite para novos utilizadores (Admin)"),
        BotCommand(command="/apagarutilizador", description="Remove um utilizador do sistema (Admin)"),
        BotCommand(command="/listarusuarios", description="Lista todos os utilizadores registrados (Admin)"),
        BotCommand(command="/alterarnivel", description="Gera um código de alteração de nível de acesso (Admin)"),
        BotCommand(command="/usarcodigo", description="Usa um código para alterar seu nível de acesso"),
        BotCommand(command="/funcoes", description="Lista todas as funções disponíveis"),
        # BotCommand(command="/feedback", description="Inicia uma pesquisa de satisfação")
    ]      
           
    await bot.set_my_commands(commands)

import signal

def signal_handler(sig, frame):
    last_chat_id = get_last_chat_id()
    if last_chat_id:
        asyncio.create_task(enviar_mensagem_desligamento(last_chat_id))
    logger.info("Bot desligado")
    asyncio.get_event_loop().stop()

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# Adicionar os handlers de callback
async def handle_callbacks(call: types.CallbackQuery, state: FSMContext):
    logger.info(f"Callback recebido: {call.data}")  # Log para verificar se os callbacks estão sendo recebidos corretamente
    data = call.data

    # Tenta remover os botões antigos, se houver, mas ignora erros específicos
    try:
        await call.message.edit_reply_markup(reply_markup=None)
    except (MessageNotModified, aiogram.utils.exceptions.MessageCantBeEdited) as e:
        logger.warning(f"Mensagem não pode ser editada ou já foi modificada: {e}")
        # Continue mesmo se a mensagem não puder ser editada ou já tiver sido modificada

    # Tratar o callback de acordo com o dado recebido
    if call.data.startswith('feedback_q'):
        await process_feedback(call)  # Passa o CallbackQuery e o FSMContext

    else:
        # Tratar o callback de acordo com o dado recebido
        if data == "menu_consultas":
            await menu_consultas(call)
        elif data == "menu_definicoes":
            await menu_definicoes(call)
        elif data == "menu_inicial":
            await mostrar_menu_inicial(call.message)
        elif data == "consultargrupo":
            await consultar_grupo(call)
        elif data == "consultar":
            await consultar(call)
        elif data == "exportardados":
            await exportardados(call.message)
        elif data == "listarusuarios":
            await listar_usuarios(call)
        elif data == "gerarconvite":
            await gerar_convite(call)
        elif data == "alterarnivel":
            await gerar_codigo_alteracao(call)
        elif data == "apagarutilizador":
            await apagar_utilizador(call)
        elif data == "registo":
            await registo(call.message)
        elif data == "usarcodigo":
            await usarcodigo(call.message)
        elif data == "help":
            await send_help(call.message)
        elif data == "funcoes":
            await listar_funcoes(call.message)
        elif data == "feedback":
            await start_feedback(call.message)  # Chama a função de feedback
        elif data.startswith('consultar_selecionar_grupo:'):
            await processar_selecao_grupo(call)
        elif data.startswith('consultar_selecionar_loja:'):
            await processar_selecao_loja(call)
        elif data.startswith('nivel_acesso_convite:'):
            await processar_nivel_acesso_convite(call)
        elif data.startswith('grupo_convite:'):
            await processar_grupo_convite(call)
        elif data.startswith('loja_convite:'):
            await processar_loja_convite(call)
        elif data.startswith('nivel_acesso_alteracao:'):
            await processar_nivel_acesso_alteracao(call)
        elif data.startswith('consultar_grupo:'):
            await processar_consultar_grupo(call)
        elif data.startswith('periodo_grupo:'):
            await process_periodo_grupo_step(call)
        elif data.startswith('exportar_grupo:'):
            await process_exportar_grupo(call)
        elif data.startswith('exportar_loja:'):
            await process_exportar_loja(call)
        elif data == "nova_consulta_exportar":
            await processar_nova_consulta_exportar(call)
        elif data.startswith('periodo:'):
            await process_periodo_step(call)
        elif data == "nova_consulta_lojas":
            await processar_nova_consulta_lojas(call)
        elif data == "nova_consulta_grupo":
            await processar_nova_consulta_grupo(call)
        elif data.startswith('heatmap:'):
            await process_heatmap_choice(call)
        elif data == "nova_consulta_exportar":
            await exportardados(call.message)
        elif data == "nova_consulta_gerar_convite":
            await gerar_convite(call)
        elif data == "nova_consulta_alterar_nivel":
            await gerar_codigo_alteracao(call)
        elif data == "nova_consulta_apagar_utilizador":
            await apagar_utilizador(call)
        elif data == "sair_para_inicial" or data == "voltar":
            user_data[str(call.message.chat.id)]["saiu"] = True
            save_user_data()
            await mostrar_menu_inicial(call.message)
        elif data.startswith('grupo_alteracao:'):
            await processar_grupo_alteracao(call)
        elif data.startswith('loja_alteracao:'):
            await processar_loja_alteracao(call)
        elif data.startswith('codigo_alteracao:'):
            await processar_codigo_alteracao(call)

    # Feedback para o usuário
    await call.answer()

    # Finalizar o estado, se necessário
    await state.finish()

async def main():
    global bot, dp

    # Carregar dados dos arquivos JSON
    load_user_data()
    load_invites()
    load_alteration_codes()
    load_super_admin()

    # Instanciando o bot e o dispatcher
    bot = Bot(token=TELEGRAM_TOKEN_TEST)
    storage = MemoryStorage()
    dp = Dispatcher(bot, storage=storage)

    # Adicionando middleware de logging
    dp.middleware.setup(LoggingMiddleware())

    # Definir comandos iniciais do bot
    await set_commands(bot)

   # Registrar os handlers de mensagem e callback
    dp.register_message_handler(handle_heavy_task, commands=['start_heavy_task'])
    dp.register_message_handler(send_welcome, commands=['start'])
    dp.register_message_handler(send_help, commands=['help'])
    dp.register_message_handler(listar_funcoes, commands=['funcoes'])
    dp.register_message_handler(registo, commands=['registo'])
    dp.register_message_handler(consultar, commands=['consultar'])
    dp.register_message_handler(consultar_grupo, commands=['consultargrupo'])
    dp.register_message_handler(gerar_convite, commands=['gerarconvite'])
    dp.register_message_handler(apagar_utilizador, commands=['apagarutilizador'])
    dp.register_message_handler(listar_usuarios, commands=['listarusuarios'])
    dp.register_message_handler(gerar_codigo_alteracao, commands=['alterarnivel'])
    dp.register_message_handler(usarcodigo, commands=['usarcodigo'])
    dp.register_message_handler(exportardados, commands=['exportardados'])
    dp.register_message_handler(start_feedback, commands=["feedback"])  # Adiciona o comando /feedback

    dp.register_callback_query_handler(menu_consultas, lambda call: call.data == "menu_consultas")
    dp.register_callback_query_handler(menu_definicoes, lambda call: call.data == "menu_definicoes")
    dp.register_callback_query_handler(mostrar_menu_inicial, lambda call: call.data == 'sair_para_inicial')
    dp.register_callback_query_handler(consultar, lambda call: call.data == 'consultar')
    dp.register_callback_query_handler(process_periodo_step, lambda call: call.data.startswith('periodo:'))
    dp.register_callback_query_handler(process_heatmap_choice, lambda call: call.data.startswith('heatmap:'))
    dp.register_callback_query_handler(exportardados, lambda call: call.data == 'exportardados')
    dp.register_callback_query_handler(process_exportar_loja, lambda call: call.data.startswith("exportar_loja:"))
    dp.register_callback_query_handler(process_exportar_grupo, lambda call: call.data.startswith("exportar_grupo:"))
    dp.register_callback_query_handler(processar_nova_consulta_exportar, lambda call: call.data == "nova_consulta_exportar")
    dp.register_callback_query_handler(consultar_grupo, lambda call: call.data == "consultargrupo")
    dp.register_callback_query_handler(processar_consultar_grupo, lambda call: call.data.startswith("consultar_grupo:")) 
    dp.register_callback_query_handler(process_periodo_grupo_step, lambda call: call.data.startswith("periodo_grupo:"))

    dp.register_message_handler(processar_apagar_usuario, lambda message: message.chat.id in user_states and user_states[message.chat.id]['step'] == 'apagar_usuario')
    dp.register_message_handler(processar_codigo_alteracao, lambda message: message.chat.id in user_states and user_states[message.chat.id]['step'] == 'codigo_alteracao')
    dp.register_message_handler(processar_data_hora_inicio, lambda message: message.chat.id in user_states and user_states[message.chat.id]['step'] == 'data_hora_inicio')
    dp.register_message_handler(processar_data_hora_fim, lambda message: message.chat.id in user_states and user_states[message.chat.id]['step'] == 'data_hora_fim')
    dp.register_message_handler(processar_data_hora_inicio_grupo, lambda message: message.chat.id in user_states and user_states[message.chat.id]['step'] == 'data_hora_inicio_grupo')
    dp.register_message_handler(processar_data_hora_fim_grupo, lambda message: message.chat.id in user_states and user_states[message.chat.id]['step'] == 'data_hora_fim_grupo')
    dp.register_message_handler(processar_data_hora_inicio_exportar, lambda message: message.chat.id in user_states and user_states[message.chat.id]['step'] == 'data_hora_inicio_exportar')
    dp.register_message_handler(processar_data_hora_fim_exportar, lambda message: message.chat.id in user_states and user_states[message.chat.id]['step'] == 'data_hora_fim_exportar')
    dp.register_message_handler(processar_codigo_convite, lambda message: message.chat.id in user_states and user_states[message.chat.id]['step'] == 'codigo_convite')
    dp.register_callback_query_handler(processar_nivel_acesso_convite, lambda call: call.data.startswith('nivel_acesso_convite:'))
    dp.register_callback_query_handler(processar_grupo_convite, lambda call: call.data.startswith('grupo_convite:'))
    dp.register_callback_query_handler(processar_loja_convite, lambda call: call.data.startswith('loja_convite:'))
    dp.register_callback_query_handler(processar_selecao_grupo, lambda call: call.data.startswith('consultar_selecionar_grupo:'))
    dp.register_callback_query_handler(processar_selecao_loja, lambda call: call.data.startswith('consultar_selecionar_loja:'))
    dp.register_callback_query_handler(processar_nova_consulta_grupo, lambda call: call.data == 'nova_consulta_grupo')
    dp.register_callback_query_handler(processar_nova_consulta_lojas, lambda call: call.data == 'nova_consulta_lojas')
    dp.register_callback_query_handler(lambda call: gerar_convite(call), lambda call: call.data == 'nova_consulta_gerar_convite')
    dp.register_callback_query_handler(lambda call: gerar_codigo_alteracao(call), lambda call: call.data == 'nova_consulta_alterar_nivel')
    dp.register_callback_query_handler(lambda call: apagar_utilizador(call), lambda call: call.data == 'nova_consulta_apagar_utilizador')
    dp.register_callback_query_handler(listar_usuarios, lambda call: call.data == "listarusuarios")
    dp.register_callback_query_handler(gerar_convite, lambda call: call.data == "gerarconvite")
    dp.register_callback_query_handler(gerar_codigo_alteracao, lambda call: call.data == "alterarnivel")
    dp.register_callback_query_handler(processar_nivel_acesso_alteracao, lambda call: call.data.startswith("nivel_acesso_alteracao:"))
    dp.register_callback_query_handler(processar_grupo_alteracao, lambda call: call.data.startswith("grupo_alteracao:"))
    dp.register_callback_query_handler(processar_loja_alteracao, lambda call: call.data.startswith("loja_alteracao:"))
    dp.register_callback_query_handler(apagar_utilizador, lambda call: call.data == "apagarutilizador")
    dp.register_callback_query_handler(usarcodigo, lambda call: call.data == "usarcodigo")
    dp.register_message_handler(processar_codigo_alteracao, lambda message: message.chat.id in user_states and user_states[message.chat.id]['step'] == 'codigo_alteracao')
    dp.register_callback_query_handler(registo, lambda call: call.data == "registo")
    dp.register_callback_query_handler(listar_funcoes, lambda call: call.data == "funcoes")

    # Outros handlers de callback
    dp.register_callback_query_handler(cancelar_consulta, lambda call: call.data == 'sair_para_inicial')
    dp.register_callback_query_handler(lambda call: send_help(call.message), lambda call: call.data == 'sair_para_inicial')
    dp.register_callback_query_handler(mostrar_menu_inicial, lambda call: call.data == 'sair_para_inicial')

    # Registrar handlers de feedback e processos customizados
    dp.register_callback_query_handler(process_feedback, lambda call: call.data.startswith('feedback_q'))
    dp.register_callback_query_handler(process_feedback, lambda c: c.data and c.data.startswith('feedback_q'), state="*")
    dp.register_message_handler(handle_text_response, state=FeedbackStates.question6)


    try:

        # Iniciar polling do bot
        await dp.start_polling()
    except Exception as e:
        logger.error(f"Erro durante a execução do bot: {str(e)}", exc_info=True)
        raise
    finally:
        # Fechar bot ao encerrar
        await bot.close()

# Início do script
if __name__ == '__main__':
    load_super_admin()
    if super_admin.get('chat_id'):
        asyncio.run(main())
    else:
        print("Super Admin não está definido. Por favor, configure o Super Admin no arquivo super_admin.json.")