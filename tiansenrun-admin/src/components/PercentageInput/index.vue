<template>
    <el-input-number class="inputLeft percentage-input" v-model="displayValue" :min="min" :max="max" :step="step"
        :precision="precision" :disabled="disabled" :controls="controls" :placeholder="placeholder"
        @change="handleChange">
        <template #suffix>%</template>
    </el-input-number>
</template>

<script setup lang="ts">
const props = defineProps({
    modelValue: {
        type: Number,
        default: null
    },
    min: {
        type: Number,
        default: 0
    },
    max: {
        type: Number,
        default: 100
    },
    step: {
        type: Number,
        default: 1
    },
    precision: {
        type: Number,
        default: 0
    },
    disabled: {
        type: Boolean,
        default: false
    },
    controls: {
        type: Boolean,
        default: false
    },
    placeholder: {
        type: String,
        default: '百分比'
    }
});

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const emit = defineEmits(['update:modelValue','calculate']);
// 显示值（百分比形式）
const displayValue = ref<number | null>(null)
const internalValue = computed({
    get: () => {
        if (props.modelValue === null || props.modelValue === undefined) {
            return null
        }
        return parseFloat((props.modelValue * 100).toFixed(props.precision))
    },
    set: (value) => {
        if (value === null || value === undefined) {
            emit('update:modelValue', null)
        } else {
            // 将百分比转换为小数
            const decimalValue = parseFloat((value / 100).toFixed(props.precision + 2))
            emit('update:modelValue', decimalValue)
            // 当值改变时触发计算方法
            emit('calculate', decimalValue)
        }
    }
})

// 监听 modelValue 变化
watch(
    () => props.modelValue,
    (newVal) => {
        displayValue.value = internalValue.value
    },
    { immediate: true }
)

// 处理值变化
function handleChange(value: number | null) {
    internalValue.value = value
}
</script>

<style scoped lang="scss">
.percentage-input {
    width: 100%;
    height: 32px;
}
</style>
