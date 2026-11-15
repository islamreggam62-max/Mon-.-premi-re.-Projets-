-- TRUST — private file storage for contract documents.
-- Objects live at "<org_id>/<contract_id>/<document_id>.<pdf|docx>" in the "contracts" bucket.
--
-- Signed-in users may only ADD a file, inside their own organisation's folder.
--   * No read policy: files are handed out by the application through short-lived
--     links created on the server, after it has checked the document row as the user
--     and recorded the download in the audit log.
--   * No update or delete policy: a stored file can never be replaced or removed by a
--     user, so the file behind an approved document stays the file that was approved.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contracts', 'contracts', false, 26214400, array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy trust_contracts_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'contracts'
              and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}[.](pdf|docx)$'
              and private.has_role(private.try_uuid((storage.foldername(name))[1]),
                                   array['owner', 'admin', 'manager']::public.org_role[]));
