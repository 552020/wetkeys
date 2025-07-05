import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type delete_file_response = { 'Ok' : null } |
  { 'NotFound' : null };
export type download_file_response = { 'found_file' : file_data } |
  { 'permission_error' : null } |
  { 'not_uploaded_file' : null } |
  { 'not_found_file' : null };
export interface file_data {
  'contents' : Uint8Array | number[],
  'file_type' : string,
  'num_chunks' : bigint,
}
export type file_id = bigint;
export interface file_metadata {
  'file_status' : file_status,
  'file_name' : string,
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
export type upload_file_error = { 'not_requested' : null } |
  { 'already_uploaded' : null };
export interface upload_file_request {
  'content' : Uint8Array | number[],
  'name' : string,
  'file_type' : string,
  'num_chunks' : bigint,
}
export type upload_file_response = { 'Ok' : null } |
  { 'Err' : upload_file_error };
export type user = {};
export interface _SERVICE {
  'delete_file' : ActorMethod<[file_id], delete_file_response>,
  'download_file' : ActorMethod<[file_id, bigint], download_file_response>,
  'greet' : ActorMethod<[string], string>,
  'list_files' : ActorMethod<[], Array<file_metadata>>,
  'register_file' : ActorMethod<
    [register_file_request],
    register_file_response
  >,
  'upload_file_atomic' : ActorMethod<[upload_file_atomic_request], file_id>,
  'upload_file_continue' : ActorMethod<
    [upload_file_continue_request],
    upload_file_response
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
