import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface create_user_request {
  'username' : string,
  'email' : [] | [string],
  'display_name' : [] | [string],
}
export type delete_file_response = { 'Ok' : null } |
  { 'NotFound' : null };
export type download_file_response = { 'found_file' : file_data } |
  { 'permission_error' : null } |
  { 'not_uploaded_file' : null } |
  { 'not_found_file' : null };
export type error_with_file_upload = { 'not_requested' : null } |
  { 'already_uploaded' : null };
export interface file_data {
  'contents' : Uint8Array | number[],
  'file_type' : string,
  'num_chunks' : bigint,
}
export type file_id = bigint;
export interface file_metadata {
  'file_status' : file_status,
  'file_name' : string,
  'shared_with' : Array<user>,
  'file_id' : file_id,
}
export type file_status = { 'partially_uploaded' : null } |
  { 'pending' : { 'alias' : string, 'requested_at' : bigint } } |
  { 'uploaded' : { 'uploaded_at' : bigint } };
export interface register_file_request {
  'blob_id' : [] | [string],
  'file_name' : string,
  'requested_at' : bigint,
  'storage_provider' : string,
  'uploaded_at' : [] | [bigint],
}
export interface register_file_response { 'file_id' : file_id }
export interface update_user_request {
  'username' : [] | [string],
  'email' : [] | [string],
  'display_name' : [] | [string],
}
export interface upload_file_atomic_request {
  'content' : Uint8Array | number[],
  'name' : string,
  'file_type' : string,
  'num_chunks' : bigint,
}
export interface upload_file_continue_request {
  'file_type' : string,
  'num_chunks' : bigint,
  'file_content' : Uint8Array | number[],
  'file_id' : file_id,
}
export interface upload_file_request {
  'content' : Uint8Array | number[],
  'name' : string,
  'file_type' : string,
  'num_chunks' : bigint,
}
export type upload_file_response = { 'Ok' : null } |
  { 'Err' : error_with_file_upload };
export type user = {};
export type user_list_response = { 'Ok' : Array<user_profile> } |
  { 'NotAuthenticated' : null };
export interface user_profile {
  'storage_used' : bigint,
  'last_login' : bigint,
  'username' : string,
  'created_at' : bigint,
  'email' : [] | [string],
  'display_name' : [] | [string],
  'is_active' : boolean,
  'principal_id' : Principal,
  'file_count' : bigint,
}
export type user_response = { 'Ok' : user_profile } |
  { 'InvalidInput' : null } |
  { 'NotFound' : null } |
  { 'AlreadyExists' : null } |
  { 'NotAuthenticated' : null };
export interface _SERVICE {
  'create_user_profile' : ActorMethod<[create_user_request], user_response>,
  'delete_file' : ActorMethod<[file_id], delete_file_response>,
  'delete_user_profile' : ActorMethod<[], user_response>,
  'download_file' : ActorMethod<[file_id, bigint], download_file_response>,
  'get_user_profile' : ActorMethod<[], user_response>,
  'get_user_stats' : ActorMethod<[], user_response>,
  'greet' : ActorMethod<[string], string>,
  'list_files' : ActorMethod<[], Array<file_metadata>>,
  'list_users' : ActorMethod<[], user_list_response>,
  'register_file' : ActorMethod<
    [register_file_request],
    register_file_response
  >,
  'update_user_profile' : ActorMethod<[update_user_request], user_response>,
  'upload_file_atomic' : ActorMethod<[upload_file_atomic_request], file_id>,
  'upload_file_continue' : ActorMethod<
    [upload_file_continue_request],
    upload_file_response
  >,
  'vetkd_encrypted_key' : ActorMethod<
    [Uint8Array | number[], [] | [bigint]],
    Uint8Array | number[]
  >,
  'vetkd_public_key' : ActorMethod<[], Uint8Array | number[]>,
  'whoami' : ActorMethod<[], Principal>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
