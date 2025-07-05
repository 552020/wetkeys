export const idlFactory = ({ IDL }) => {
  const file_id = IDL.Nat64;
  const delete_file_response = IDL.Variant({
    'Ok' : IDL.Null,
    'NotFound' : IDL.Null,
  });
  const file_status = IDL.Variant({
    'partially_uploaded' : IDL.Null,
    'pending' : IDL.Record({ 'alias' : IDL.Text, 'requested_at' : IDL.Nat64 }),
    'uploaded' : IDL.Record({ 'uploaded_at' : IDL.Nat64 }),
  });
  const file_metadata = IDL.Record({
    'file_status' : file_status,
    'file_name' : IDL.Text,
    'file_id' : file_id,
  });
  const file = IDL.Record({
    'contents' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'metadata' : file_metadata,
  });
  const download_file_response = IDL.Variant({
    'Ok' : file,
    'permission_error' : IDL.Null,
    'not_uploaded_file' : IDL.Null,
    'not_found_file' : IDL.Null,
  });
  const upload_file_atomic_request = IDL.Record({
    'content' : IDL.Vec(IDL.Nat8),
    'name' : IDL.Text,
    'file_type' : IDL.Text,
    'num_chunks' : IDL.Nat64,
  });
  const upload_file_continue_request = IDL.Record({
    'file_type' : IDL.Text,
    'num_chunks' : IDL.Nat64,
    'file_content' : IDL.Vec(IDL.Nat8),
    'file_id' : file_id,
  });
  const upload_file_error = IDL.Variant({
    'not_requested' : IDL.Null,
    'already_uploaded' : IDL.Null,
  });
  const upload_file_response = IDL.Variant({
    'Ok' : IDL.Null,
    'Err' : upload_file_error,
  });
  return IDL.Service({
    'delete_file' : IDL.Func([file_id], [delete_file_response], []),
    'download_file' : IDL.Func(
        [file_id, IDL.Nat64],
        [download_file_response],
        ['query'],
      ),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'list_files' : IDL.Func([], [IDL.Vec(file_metadata)], ['query']),
    'upload_file_atomic' : IDL.Func(
        [upload_file_atomic_request],
        [file_id],
        [],
      ),
    'upload_file_continue' : IDL.Func(
        [upload_file_continue_request],
        [upload_file_response],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
