
import React from 'react';

const SupabaseSQL_CopyMe: React.FC = () => {
    const sqlCode = `
-- 1. Create the table for Seminars
create table public_seminars (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  title text not null,
  url text not null,
  color text default 'bg-blue-600'
);

-- 2. Enable Row Level Security (RLS)
alter table public_seminars enable row level security;

-- 3. Policy: Everyone can READ (All users)
create policy "Public Seminars are viewable by everyone" 
on public_seminars for select 
using ( true );

-- 4. Policy: Only Admin can INSERT/DELETE (Update with your specific email if needed, or allow authenticated users for now if you are the only one)
-- For simplicity, if you are the only logged in user managing this, allow authenticated:
create policy "Admins can insert seminars" 
on public_seminars for insert 
with check ( auth.role() = 'authenticated' );

create policy "Admins can delete seminars" 
on public_seminars for delete 
using ( auth.role() = 'authenticated' );
`;

    return (
        <div className="p-4 bg-slate-900 text-slate-300 rounded-lg text-left" dir="ltr">
            <h3 className="text-white font-bold mb-2">Supabase SQL Setup</h3>
            <p className="mb-4 text-sm">Copy and run this in your Supabase SQL Editor to create the Seminars table:</p>
            <pre className="bg-black p-4 rounded overflow-x-auto text-xs font-mono select-all">
                {sqlCode}
            </pre>
        </div>
    );
};

export default SupabaseSQL_CopyMe;