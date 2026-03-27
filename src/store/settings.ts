import {defineStore} from 'pinia'

export const useSettingsStore = defineStore('count',{
    state(){
        return{
            hourlyRate: 196,
            globalBreakMinutes: 0
        }
    }
});