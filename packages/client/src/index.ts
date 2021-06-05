import axios, { AxiosInstance } from 'axios'
import {
  createGet,
  createPost,
  createDelete,
  Get,
  Post,
  Delete,
} from './helper'
import {
  GetIdentityDigestRes,
  GetIdentityReq,
  GetIdentityRes,
  PostIdentityReq,
  DeleteIdentityReq,
  GetVerificationKeyReq,
} from './type'

export class Client {
  private instance: AxiosInstance

  public readIdentityDigest: Get<{}, GetIdentityDigestRes>
  public readIdentity: Get<GetIdentityReq, GetIdentityRes>
  public createIdentity: Post<PostIdentityReq, {}>
  public deleteIdentity: Delete<DeleteIdentityReq>
  public readVerificationKey: Get<{}, GetVerificationKeyReq>

  constructor(endpoint: string) {
    this.instance = axios.create({ baseURL: endpoint })
    this.readIdentityDigest = createGet<{}, GetIdentityDigestRes>(
      this.instance,
      '/identity/digest',
    )
    this.createIdentity = createPost<PostIdentityReq, {}>(
      this.instance,
      '/identity',
    )
    this.readIdentity = createGet<GetIdentityReq, GetIdentityRes>(
      this.instance,
      '/identity/{identityCommitment}',
    )
    this.deleteIdentity = createDelete<DeleteIdentityReq>(
      this.instance,
      '/identity/{identityCommitment}',
    )
    this.readVerificationKey = createGet<{}, GetVerificationKeyReq>(
      this.instance,
      '/key/verification',
    )
  }
}
