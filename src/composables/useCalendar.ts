import { ref, computed, watch } from 'vue';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay, addMonths, subMonths } from 'date-fns';
import { loadMonthData } from '@/utils/storage';
import { calculateWorkHours, getHolidayName } from '@/utils/time';
import { useSalaryStore } from '@/store/salary';
import { useUiStore } from '@/store/ui';

export function useCalendar() {
    const salaryStore = useSalaryStore();
    const uiStore = useUiStore();

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    const monthData = ref<Record<string, any>>({});

    const currentMonthFormatted = computed(() => {
        const [year, month] = salaryStore.currentMonth.split('-');
        return `${year}年${month}月`;
    });

    const calendarDates = computed(() => {
        const parts = salaryStore.currentMonth.split('-');
        if (parts.length !== 2) return [];
        const yearStr = parts[0];
        const monthStr = parts[1];
        if (!yearStr || !monthStr) return [];
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        if (isNaN(year) || isNaN(month)) return [];

        const monthStart = startOfMonth(new Date(year, month));
        const monthEnd = endOfMonth(monthStart);
        const startDate = new Date(monthStart);
        startDate.setDate(startDate.getDate() - getDay(monthStart)); // Start from Sunday

        const endDate = new Date(monthEnd);
        endDate.setDate(endDate.getDate() + (6 - getDay(monthEnd))); // End on Saturday

        const dates = eachDayOfInterval({ start: startDate, end: endDate });

        return dates.map(date => ({
            dateStr: format(date, 'yyyy-MM-dd'),
            day: date.getDate(),
            isCurrentMonth: isSameMonth(date, monthStart),
            isToday: isToday(date)
        }));
    });

    /**
     * 加載當前月份的數據
     */
    function loadCurrentMonthData() {
        monthData.value = loadMonthData(salaryStore.currentMonth);
    }

    /**
     * 檢查指定日期是否有工作條目
     */
    function hasWorkEntry(dateStr: string): boolean {
        return !!monthData.value[dateStr];
    }

    /**
     * 獲取指定日期的工作時數
     */
    function getWorkHours(dateStr: string): number {
        const entry = monthData.value[dateStr];
        if (!entry || !entry.start || !entry.end) return 0;

        return Math.round(calculateWorkHours(entry.start, entry.end, entry.breakMinutes || 0) * 10) / 10;
    }

    /**
     * 獲取指定日期的開始時間
     */
    function getStartTime(dateStr: string): string {
        const entry = monthData.value[dateStr];
        return entry?.start || '--:--';
    }

    /**
     * 獲取指定日期的結束時間
     */
    function getEndTime(dateStr: string): string {
        const entry = monthData.value[dateStr];
        return entry?.end || '--:--';
    }

    /**
     * 獲取指定日期的假日名稱
     */
    function getHolidayNameForDate(dateStr: string): string | null {
        const date = new Date(dateStr);
        return getHolidayName(date);
    }

    /**
     * 切換到上一個月
     */
    function previousMonth() {
        const parts = salaryStore.currentMonth.split('-');
        if (parts.length !== 2) return;
        const yearStr = parts[0];
        const monthStr = parts[1];
        if (!yearStr || !monthStr) return;
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        if (isNaN(year) || isNaN(month)) return;

        const newMonth = format(subMonths(new Date(year, month), 1), 'yyyy-MM');
        salaryStore.onMonthChanged(newMonth);
    }

    /**
     * 切換到下一個月
     */
    function nextMonth() {
        const parts = salaryStore.currentMonth.split('-');
        if (parts.length !== 2) return;
        const yearStr = parts[0];
        const monthStr = parts[1];
        if (!yearStr || !monthStr) return;
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        if (isNaN(year) || isNaN(month)) return;

        const newMonth = format(addMonths(new Date(year, month), 1), 'yyyy-MM');
        salaryStore.onMonthChanged(newMonth);
    }

    // Watch for month changes
    watch(() => salaryStore.currentMonth, loadCurrentMonthData, { immediate: true });

    // Watch for refreshKey changes to reload data
    watch(() => uiStore.refreshCalendar, () => {
        loadCurrentMonthData();
    });

    return {
        weekDays,
        currentMonthFormatted,
        calendarDates,
        monthData,
        loadCurrentMonthData,
        hasWorkEntry,
        getWorkHours,
        getStartTime,
        getEndTime,
        getHolidayNameForDate,
        previousMonth,
        nextMonth
    };
}