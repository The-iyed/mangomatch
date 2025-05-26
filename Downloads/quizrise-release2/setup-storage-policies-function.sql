-- Create a stored procedure to set up storage policies
CREATE OR REPLACE FUNCTION setup_storage_policies(bucket_id TEXT)
RETURNS VOID AS $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;
  
  -- Create policy to allow public read access
  CREATE POLICY "Allow public read access" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = $1);
  
  -- Create policy to allow authenticated users to upload files
  CREATE POLICY "Allow authenticated users to upload files" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = $1);
  
  -- Create policy to allow authenticated users to update files
  CREATE POLICY "Allow authenticated users to update files" 
  ON storage.objects FOR UPDATE 
  TO authenticated 
  USING (bucket_id = $1);
  
  -- Create policy to allow authenticated users to delete files
  CREATE POLICY "Allow authenticated users to delete files" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING (bucket_id = $1);
END;
$$ LANGUAGE plpgsql;
