-- ==============================================================================
-- WELCOME MOTOR - SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Dealership: WELCOME MOTOR
-- Owner: Arslan Farooq (Rawalpindi Cricket Stadium)
-- ==============================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE VEHICLES TABLE
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    price BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available', -- 'available', 'reserved', 'sold'
    images TEXT[] NOT NULL DEFAULT '{}',
    
    -- Optional Fields (Hidden publicly if empty)
    variant VARCHAR(100),
    mileage INTEGER,
    fuel_type VARCHAR(50),
    transmission VARCHAR(50),
    engine_capacity VARCHAR(50),
    color VARCHAR(50),
    registration_city VARCHAR(100),
    condition VARCHAR(50),
    assembly VARCHAR(50), -- 'Local', 'Imported'
    owners_count VARCHAR(50),
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    safety_features JSONB DEFAULT '[]'::jsonb,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for high-speed searches and filters
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON public.vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON public.vehicles(price);
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON public.vehicles(year);
CREATE INDEX IF NOT EXISTS idx_vehicles_featured ON public.vehicles(featured);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON public.vehicles(created_at DESC);

-- 3. CREATE BUSINESS SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'dealership_settings',
    dealership_name VARCHAR(150) NOT NULL DEFAULT 'WELCOME MOTOR',
    owner_name VARCHAR(150) NOT NULL DEFAULT 'Arslan Farooq',
    tagline TEXT NOT NULL DEFAULT '17 Years of Trust. 2,179 Cars Driven Home.',
    phone VARCHAR(50) NOT NULL DEFAULT '0313-3884499',
    whatsapp VARCHAR(50) NOT NULL DEFAULT '0313-3884499',
    address TEXT NOT NULL DEFAULT 'Rawalpindi Cricket Stadium, J3VG+FWR, Murree Rd, Rawalpindi Stadium Rd, Satellite Town, Rawalpindi 46000, Pakistan',
    google_maps_url TEXT NOT NULL DEFAULT 'https://maps.app.goo.gl/shWDXxyVJ9MNbEK27',
    years_experience INTEGER NOT NULL DEFAULT 17,
    cars_sold INTEGER NOT NULL DEFAULT 2179,
    google_rating NUMERIC(2,1) NOT NULL DEFAULT 4.8,
    opening_hours VARCHAR(100) NOT NULL DEFAULT 'Open 24/7',
    license_number VARCHAR(100), -- Hidden publicly if empty
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert Default Settings if not exists
INSERT INTO public.settings (
    id, dealership_name, owner_name, tagline, phone, whatsapp, 
    address, google_maps_url, years_experience, cars_sold, google_rating, opening_hours, license_number
) VALUES (
    'dealership_settings',
    'WELCOME MOTOR',
    'Arslan Farooq',
    '17 Years of Trust. 2,179 Cars Driven Home.',
    '0313-3884499',
    '0313-3884499',
    'Rawalpindi Cricket Stadium, J3VG+FWR, Murree Rd, Rawalpindi Stadium Rd, Satellite Town, Rawalpindi 46000, Pakistan',
    'https://maps.app.goo.gl/shWDXxyVJ9MNbEK27',
    17,
    2179,
    4.8,
    'Open 24/7',
    NULL
) ON CONFLICT (id) DO NOTHING;

-- 4. CREATE INQUIRIES TABLE (Customer Messages)
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    vehicle_title VARCHAR(200),
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(150),
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'closed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Public can read all vehicles
CREATE POLICY "Public Read Vehicles" 
ON public.vehicles FOR SELECT 
USING (true);

-- Authenticated Admin Full Access for Vehicles
CREATE POLICY "Admin All Access Vehicles" 
ON public.vehicles FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Anon Full Access for Vehicles (enabled for client API key operations)
CREATE POLICY "Anon Write Access Vehicles" 
ON public.vehicles FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

-- Public can read settings
CREATE POLICY "Public Read Settings" 
ON public.settings FOR SELECT 
USING (true);

-- Admin update settings
CREATE POLICY "Admin Update Settings" 
ON public.settings FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Anon Update Settings" 
ON public.settings FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

-- Public can submit inquiries
CREATE POLICY "Public Insert Inquiries" 
ON public.inquiries FOR INSERT 
WITH CHECK (true);

-- Admin read/manage inquiries
CREATE POLICY "Admin Inquiries Access" 
ON public.inquiries FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Anon Inquiries Access" 
ON public.inquiries FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

-- 6. STORAGE SETUP FOR VEHICLE IMAGES
-- Create bucket 'vehicle-images' if not already created
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public can view images
CREATE POLICY "Public Read Vehicle Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

-- Allow Image Uploads
CREATE POLICY "Allow Image Uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vehicle-images');

CREATE POLICY "Allow Image Updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Allow Image Deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'vehicle-images');
