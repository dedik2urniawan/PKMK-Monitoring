-- ============================================
-- RLS Policies for survey_determinan table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================

-- Step 1: Enable RLS on the table (if not already enabled)
ALTER TABLE survey_determinan ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Users can select survey_determinan" ON survey_determinan;
DROP POLICY IF EXISTS "Users can insert survey_determinan" ON survey_determinan;
DROP POLICY IF EXISTS "Users can update survey_determinan" ON survey_determinan;
DROP POLICY IF EXISTS "Users can delete survey_determinan" ON survey_determinan;

-- Step 3: Create SELECT policy
-- Allows authenticated users to read all survey_determinan records
CREATE POLICY "Users can select survey_determinan" ON survey_determinan
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Step 4: Create INSERT policy
-- Allows authenticated users to insert new survey_determinan records
CREATE POLICY "Users can insert survey_determinan" ON survey_determinan
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Step 5: Create UPDATE policy
-- Allows authenticated users to update survey_determinan records
CREATE POLICY "Users can update survey_determinan" ON survey_determinan
    FOR UPDATE 
    TO authenticated 
    USING (true);

-- Step 6: Create DELETE policy
-- Allows authenticated users to delete survey_determinan records
CREATE POLICY "Users can delete survey_determinan" ON survey_determinan
    FOR DELETE 
    TO authenticated 
    USING (true);

-- ============================================
-- Verification: Check if policies are created
-- ============================================
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd 
FROM pg_policies 
WHERE tablename = 'survey_determinan';
