-- Create Admin User if not exists
INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@gidertakip.com',
  'Sistem Yöneticisi',
  '$2b$10$EX4.TE.PtnV.6ziw1puIMOxozj9.yNG2LxgY7RiLtyZqN1.2CRAGy', -- "123456"

  'ADMIN',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Create Default Organization
INSERT INTO "Organization" (id, name, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Güneş Vakfı', NOW(), NOW())
ON CONFLICT DO NOTHING;
