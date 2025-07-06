export const idlFactory = ({ IDL }) => {
  const create_user_request = IDL.Record({
    'username' : IDL.Text,
    'email' : IDL.Opt(IDL.Text),
    'display_name' : IDL.Opt(IDL.Text),
  });
  const user_profile = IDL.Record({
    'storage_used' : IDL.Nat64,
    'last_login' : IDL.Nat64,
    'username' : IDL.Text,
    'created_at' : IDL.Nat64,
    'email' : IDL.Opt(IDL.Text),
    'display_name' : IDL.Opt(IDL.Text),
    'is_active' : IDL.Bool,
    'principal_id' : IDL.Principal,
    'file_count' : IDL.Nat64,
  });
  const user_response = IDL.Variant({
    'Ok' : user_profile,
    'InvalidInput' : IDL.Null,
    'NotFound' : IDL.Null,
    'AlreadyExists' : IDL.Null,
    'NotAuthenticated' : IDL.Null,
  });
  const file_id = IDL.Nat64;
  const delete_file_response = IDL.Variant({
    'Ok' : IDL.Null,
    'NotFound' : IDL.Null,
  });
  const file_data = IDL.Record({
    'contents' : IDL.Vec(IDL.Nat8),
    'file_type' : IDL.Text,
    'num_chunks' : IDL.Nat64,
  });
  const download_file_response = IDL.Variant({
    'found_file' : file_data,
    'permission_error' : IDL.Null,
    'not_uploaded_file' : IDL.Null,
    'not_found_file' : IDL.Null,
  });
  const file_status = IDL.Variant({
    'partially_uploaded' : IDL.Null,
    'pending' : IDL.Record({ 'alias' : IDL.Text, 'requested_at' : IDL.Nat64 }),
    'uploaded' : IDL.Record({ 'uploaded_at' : IDL.Nat64 }),
  });
  const user = IDL.Record({});
  const file_metadata = IDL.Record({
    'file_status' : file_status,
    'file_name' : IDL.Text,
    'shared_with' : IDL.Vec(user),
    'file_id' : file_id,
  });
  const user_list_response = IDL.Variant({
    'Ok' : IDL.Vec(user_profile),
    'NotAuthenticated' : IDL.Null,
  });
  const register_file_request = IDL.Record({
    'blob_id' : IDL.Opt(IDL.Text),
    'file_name' : IDL.Text,
    'requested_at' : IDL.Nat64,
    'storage_provider' : IDL.Text,
    'uploaded_at' : IDL.Opt(IDL.Nat64),
  });
  const register_file_response = IDL.Record({ 'file_id' : file_id });
  const update_user_request = IDL.Record({
    'username' : IDL.Opt(IDL.Text),
    'email' : IDL.Opt(IDL.Text),
    'display_name' : IDL.Opt(IDL.Text),
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
  const error_with_file_upload = IDL.Variant({
    'not_requested' : IDL.Null,
    'already_uploaded' : IDL.Null,
  });
  const upload_file_response = IDL.Variant({
    'Ok' : IDL.Null,
    'Err' : error_with_file_upload,
  });
  const VetkdPublicKeyResponse = IDL.Variant({
    'Ok' : IDL.Vec(IDL.Nat8),
    'Err' : IDL.Text,
  });
  return IDL.Service({
    'create_user_profile' : IDL.Func(
        [create_user_request],
        [user_response],
        [],
      ),
    'delete_file' : IDL.Func([file_id], [delete_file_response], []),
    'delete_user_profile' : IDL.Func([], [user_response], []),
    'download_file' : IDL.Func(
        [file_id, IDL.Nat64],
        [download_file_response],
        ['query'],
      ),
    'get_user_profile' : IDL.Func([], [user_response], ['query']),
    'get_user_stats' : IDL.Func([], [user_response], ['query']),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'list_files' : IDL.Func([], [IDL.Vec(file_metadata)], ['query']),
    'list_users' : IDL.Func([], [user_list_response], ['query']),
    'register_file' : IDL.Func(
        [register_file_request],
        [register_file_response],
        [],
      ),
    'update_user_profile' : IDL.Func(
        [update_user_request],
        [user_response],
        [],
      ),
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
    'vetkd_public_key' : IDL.Func([], [VetkdPublicKeyResponse], []),
    'whoami' : IDL.Func([], [IDL.Principal], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
