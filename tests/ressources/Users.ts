import { computed, observable } from "mobx"
import { ownAttribute, Collection, Record } from "../../src/internals"
import { Track } from "../internals"

export class User extends Record {
  @observable
  @ownAttribute
  id: number
  @observable
  @ownAttribute
  firstName: string
  @observable
  @ownAttribute
  lastName: string
  @observable
  @ownAttribute
  email: string

  @observable
  favorites: Track[]

  @computed
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`
  }
}

export class UserCollection extends Collection<User> {
  get recordClass(): typeof User {
    return User
  }
}

export const userCollection = new UserCollection()
