<script setup lang="ts">
import { ref, computed } from "vue";
import { ChevronDown } from "lucide-vue-next";
import { GENRE_OPTIONS } from "../constants/genres";

interface Props {
    selectedGenre?: string;
}

interface Emits {
    (e: 'select', genre: string): void;
}

const props = withDefaults(defineProps<Props>(), {
    selectedGenre: ''
});

const emit = defineEmits<Emits>();

const isOpen = ref(false);

// Добавляем опцию "Все" в начало списка
const allGenreOptions = [
    { value: '', label: 'Все' },
    ...GENRE_OPTIONS
];

const selectedOption = computed(() => {
    return allGenreOptions.find(option => option.value === props.selectedGenre) || allGenreOptions[0];
});

const selectGenre = (genre: string) => {
    emit('select', genre);
    isOpen.value = false;
};

const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
    setTimeout(() => {
        isOpen.value = false;
    }, 150);
};
</script>

<template>
    <div class="mb-6">
        <h3 class="text-lg font-semibold text-kot-dark mb-3">Жанр</h3>
        <div class="relative w-full md:w-auto" style="min-width: 160px; max-width: 100%;">
            <button
                @click="toggleDropdown"
                @blur="closeDropdown"
                class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-kot-orange focus:border-kot-orange focus:ring-2 focus:ring-orange-100 transition-all whitespace-nowrap"
                style="min-width: 200px;"
                :class="{
                    'border-kot-orange ring-2 ring-orange-100': isOpen
                }"
            >
                <span class="text-gray-900">{{ selectedOption.label }}</span>
                <ChevronDown 
                    class="w-5 h-5 text-gray-400 transition-transform"
                    :class="{ 'rotate-180': isOpen }"
                />
            </button>

            <div
                v-if="isOpen"
                class="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                @mousedown.prevent
            >
                <button
                    v-for="option in allGenreOptions"
                    :key="option.value"
                    @click="selectGenre(option.value)"
                    @mousedown.stop
                    class="w-full px-4 py-3 text-left hover:bg-orange-50 hover:text-kot-orange transition-colors"
                    :class="{
                        'bg-orange-50 text-kot-orange font-medium': option.value === selectedGenre,
                        'text-gray-700': option.value !== selectedGenre
                    }"
                >
                    {{ option.label }}
                </button>
            </div>
        </div>
    </div>
</template>