-- RLS Policies for multi-tenant isolation

-- Organizations: Users can only see their own organization
CREATE POLICY "Users see own organization" ON organizations
    FOR SELECT USING (
        id = get_user_organization_id(auth.uid())
    );

CREATE POLICY "Tenant admins can update organization" ON organizations
    FOR UPDATE USING (
        id = get_user_organization_id(auth.uid()) 
        AND get_user_role(auth.uid()) = 'tenant_admin'
    );

-- User profiles: Users can see profiles in their organization
CREATE POLICY "Users see profiles in same organization" ON user_profiles
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
    );

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (
        id = auth.uid()
    );

CREATE POLICY "Admins can manage user profiles" ON user_profiles
    FOR ALL USING (
        organization_id = get_user_organization_id(auth.uid())
        AND get_user_role(auth.uid()) IN ('tenant_admin', 'regional_manager', 'store_manager')
    );

-- Regions: Organization-scoped access
CREATE POLICY "Users see regions in their organization" ON regions
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
    );

CREATE POLICY "Admins can manage regions" ON regions
    FOR ALL USING (
        organization_id = get_user_organization_id(auth.uid())
        AND get_user_role(auth.uid()) = 'tenant_admin'
    );

-- Stores: Role-based access
CREATE POLICY "Users see stores based on role" ON stores
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
        AND (
            -- Tenant admins and analysts see all stores
            get_user_role(auth.uid()) IN ('tenant_admin', 'analyst')
            OR
            -- Regional managers see stores in their regions
            (get_user_role(auth.uid()) = 'regional_manager' AND 
             EXISTS (
                SELECT 1 FROM user_regions ur
                WHERE ur.user_id = auth.uid()
                AND ur.region_id = stores.region_id
             ))
            OR
            -- Store-level users see assigned stores
            EXISTS (
                SELECT 1 FROM user_stores us
                WHERE us.user_id = auth.uid()
                AND us.store_id = stores.id
            )
        )
    );

CREATE POLICY "Managers can update stores" ON stores
    FOR UPDATE USING (
        organization_id = get_user_organization_id(auth.uid())
        AND (
            get_user_role(auth.uid()) = 'tenant_admin'
            OR
            (get_user_role(auth.uid()) = 'regional_manager' AND 
             EXISTS (
                SELECT 1 FROM user_regions ur
                WHERE ur.user_id = auth.uid()
                AND ur.region_id = stores.region_id
             ))
            OR
            (get_user_role(auth.uid()) = 'store_manager' AND
             EXISTS (
                SELECT 1 FROM user_stores us
                WHERE us.user_id = auth.uid()
                AND us.store_id = stores.id
             ))
        )
    );

-- User-store assignments
CREATE POLICY "Users see their own store assignments" ON user_stores
    FOR SELECT USING (
        user_id = auth.uid()
        OR
        get_user_role(auth.uid()) IN ('tenant_admin', 'regional_manager')
    );

CREATE POLICY "Managers can assign users to stores" ON user_stores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stores s
            WHERE s.id = user_stores.store_id
            AND s.organization_id = get_user_organization_id(auth.uid())
            AND (
                get_user_role(auth.uid()) = 'tenant_admin'
                OR
                (get_user_role(auth.uid()) = 'regional_manager' AND
                 EXISTS (
                    SELECT 1 FROM user_regions ur
                    WHERE ur.user_id = auth.uid()
                    AND ur.region_id = s.region_id
                 ))
                OR
                (get_user_role(auth.uid()) = 'store_manager' AND
                 EXISTS (
                    SELECT 1 FROM user_stores us
                    WHERE us.user_id = auth.uid()
                    AND us.store_id = s.id
                 ))
            )
        )
    );

-- User-region assignments
CREATE POLICY "Users see their own region assignments" ON user_regions
    FOR SELECT USING (
        user_id = auth.uid()
        OR
        get_user_role(auth.uid()) = 'tenant_admin'
    );

CREATE POLICY "Tenant admins can assign regions" ON user_regions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM regions r
            WHERE r.id = user_regions.region_id
            AND r.organization_id = get_user_organization_id(auth.uid())
            AND get_user_role(auth.uid()) = 'tenant_admin'
        )
    );