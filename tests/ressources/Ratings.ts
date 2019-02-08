import { observable } from "mobx"
import { BaseRecordAttributes } from "../internals"
import { ownAttribute, Collection, Record } from "../../src/internals"

export class Rating extends Record {
  @observable
  @ownAttribute
  id: number
  @observable
  @ownAttribute
  track_id: number
  @observable
  @ownAttribute
  user_id: number
  @observable
  @ownAttribute
  rate: number
}

export class RatingCollection extends Collection<Rating> {
  get recordClass(): typeof Rating {
    return Rating
  }
}

export const ratingCollection = new RatingCollection()
