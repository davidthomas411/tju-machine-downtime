-- Ensure machine_statuses has a unique constraint for upserts
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'machine_statuses_machine_id_key'
  ) then
    alter table public.machine_statuses
      add constraint machine_statuses_machine_id_key unique (machine_id);
  end if;
end $$;
