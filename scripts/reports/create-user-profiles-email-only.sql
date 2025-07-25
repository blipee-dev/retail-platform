-- Create a simple email list for Jesús Muñoz and João Melo
-- Since user_profiles requires auth.users entries, we'll create a separate solution

-- First, let's check if we need a separate email recipients table
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'report_recipients'
);

-- If not, create it
CREATE TABLE IF NOT EXISTS report_recipients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    organization_id UUID REFERENCES organizations(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Now add our recipients
INSERT INTO report_recipients (email, full_name, organization_id)
VALUES 
    ('jmunoz@patrimi.com', 'Jesús Muñoz Casas', '12345678-1234-1234-1234-123456789012'::UUID),
    ('jmelo@patrimi.com', 'João Célio Melo Pinta Moreira', '12345678-1234-1234-1234-123456789012'::UUID)
ON CONFLICT (email) DO UPDATE
SET full_name = EXCLUDED.full_name,
    organization_id = EXCLUDED.organization_id,
    updated_at = NOW();

-- Verify
SELECT * FROM report_recipients WHERE email IN ('jmunoz@patrimi.com', 'jmelo@patrimi.com');