-- TRUST — private file storage for contract documents.
-- Objects live at "<org_id>/<contract_id>/<document_id>.<ext>" in the "contracts" bucket.
-- The first folder is the tenant boundary.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contracts', 'contracts', false, 26214400, array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy trust_contracts_read on storage.objects for select to authenticated
  using (bucket_id = 'contracts'
         and private.is_member(private.try_uuid((storage.foldername(name))[1])));

create policy trust_contracts_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'contracts'
              and private.has_role(private.try_uuid((storage.foldername(name))[1]),
                                   array['owner', 'admin', 'manager']::public.org_role[]));

create policy trust_contracts_delete on storage.objects for delete to authenticated
  using (bucket_id = 'contracts'
         and private.has_role(private.try_uuid((storage.foldername(name))[1]),
                              array['owner', 'admin']::public.org_role[]));
