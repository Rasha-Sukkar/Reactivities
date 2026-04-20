import { makeAutoObservable } from "mobx";

export default class ActivityStore {
    filter = 'all';
    startDate = new Date();

    constructor() {
        makeAutoObservable(this);
    }

    setFilter = (filter: string) => {
        this.filter = filter;
    }

    setStartDate = (date: Date) => {
        this.startDate = date;
    }
}
