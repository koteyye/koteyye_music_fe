<script setup lang="ts">
import { ref, computed } from "vue";
import { ChevronDown } from "lucide-vue-next";

interface Option {
    value: string;
    label: string;
}

interface Props {
    modelValue: string;
    options: Option[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
}

interface Emits {
    (e: 'update:modelValue', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Выберите значение',
    required: false,
    disabled: false
});

const emit = defineEmits<Emits>();

const isOpen = ref(false);

const selectedOption = computed(() => {
    return props.options.find(option => option.value === props.modelValue);
});

const selectOption = (option: Option) => {
    emit('update:modelValue', option.value);
    isOpen.value = false;
};

const toggleDropdown = () => {
    if (!props.disabled) {
        isOpen.value = !isOpen.value;
    }
};

const closeDropdown = () => {
    // Небольшая задержка чтобы позволить клику обработаться
    setTimeout(() => {
        isOpen.value = false;
    }, 150);
};
</script>

<template>
    <div class="relative">
        <div
            @click="toggleDropdown"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white cursor-pointer transition-all flex items-center justify-between"
            :class="{
                'border-kot-orange ring-2 ring-orange-100': isOpen,
                'hover:border-kot-orange': !disabled && !isOpen,
                'opacity-50 cursor-not-allowed': disabled,
                'focus:border-kot-orange focus:ring-2 focus:ring-orange-100': !disabled
            }"
            tabindex="0"
            @keydown.enter="toggleDropdown"
            @keydown.space.prevent="toggleDropdown"
            @keydown.escape="closeDropdown"
            @blur="closeDropdown"
        >
            <span 
                class="truncate"
                :class="{
                    'text-gray-500': !selectedOption,
                    'text-gray-900': selectedOption
                }"
            >
                {{ selectedOption?.label || placeholder }}
            </span>
            <ChevronDown 
                class="w-5 h-5 text-gray-400 transition-transform"
                :class="{ 'rotate-180': isOpen }"
            />
        </div>

        <div
            v-if="isOpen"
            class="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
            @mousedown.prevent
        >
            <div
                v-for="option in options"
                :key="option.value"
                @click="selectOption(option)"
                @mousedown.stop
                class="px-4 py-3 cursor-pointer transition-colors hover:bg-orange-50 hover:text-kot-orange"
                :class="{
                    'bg-orange-50 text-kot-orange font-medium': option.value === modelValue,
                    'text-gray-700': option.value !== modelValue
                }"
            >
                {{ option.label }}
            </div>
        </div>
    </div>
</template>