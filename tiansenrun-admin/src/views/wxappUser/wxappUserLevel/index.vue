<template>
    <div class="p-2">
        <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
            :leave-active-class="proxy?.animate.searchAnimate.leave" @submit.native.prevent>
            <div v-show="showSearch" class="mb-[10px]">
                <el-card shadow="hover">
                    <el-form ref="queryFormRef" :model="queryParams" :inline="true">
                        <el-form-item label="vip名称" prop="name">
                            <el-input v-model="queryParams.name" placeholder="请输入vip名称" clearable
                                @keyup.enter="handleQuery" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
            </div>
        </transition>

        <el-card shadow="never">
            <template #header>
                <el-row :gutter="10" class="mb8">
                    <el-col :span="1.5">
                        <el-button type="primary" plain icon="Plus" @click="handleAdd"
                            v-hasPermi="['forest:vip:add']">新增</el-button>
                    </el-col>
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
                </el-row>
            </template>

            <el-table v-loading="loading" border :data="vipList">
                <el-table-column label="vip等级" align="center" prop="level" />
                <el-table-column label="vip名称" align="center" prop="name">
                    <template #default="scope">
                        <div :style="{ color: scope.row.textRgb, background: scope.row.backGroundRgb, 'text-align': 'center','border-radius': '5px' }">
                            {{ scope.row.name }}
                        </div>
                        <div style="padding-top: 10px;">
                            <el-progress :color="scope.row.loadingRgb" :show-text="false" :percentage="70" />
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="vip图标" align="center" prop="iconUrl">
                    <template #default="scope">
                        <image-preview :src="scope.row.iconUrl" :width="50" :height="50" />
                    </template>
                </el-table-column>
                <el-table-column label="折扣率" align="center" prop="discountValue">
                    <template #default="scope">
                        {{ scope.row.discountValue * 1 }}%
                    </template>
                </el-table-column>
                <el-table-column label="需求消费金额" align="center" prop="needAmount"></el-table-column>
                <el-table-column label="操作" align="center" fixed="right" class-name="small-padding fixed-width">
                    <template #default="scope">
                        <el-tooltip content="修改" placement="top">
                            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                                v-hasPermi="['forest:vip:edit']"></el-button>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                                v-hasPermi="['forest:vip:remove']"></el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>

            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-card>

        <!-- 添加或修改vip信息对话框 -->
        <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
            <el-form ref="vipFormRef" :model="form" :rules="rules" label-width="100">
                <el-form-item label="vip等级" prop="level">
                    <el-input-number :min="0" :precision="0" :controls="false" class="inputLeft" v-model="form.level"
                        placeholder="请输入vip等级" />
                </el-form-item>
                <el-form-item label="vip名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入vip名称"></el-input>
                </el-form-item>
                <el-form-item label="消费金额" prop="needAmount">
                    <el-input-number :min="0" :precision="0" :controls="false" class="inputLeft"
                        v-model="form.needAmount" placeholder="请输入需求消费金额" />
                </el-form-item>
                <el-form-item label="折扣率" prop="discountValue">
                    <el-input-number :min="1" :max="100" :controls="false" class="inputLeft"
                        v-model="form.discountValue" placeholder="请输入折扣率">
                        <template #suffix>%</template>
                    </el-input-number>
                </el-form-item>
                <el-form-item label="vip图标" prop="icon">
                    <image-upload :isShowTip="false" v-model="form.icon" :limit="1" />
                </el-form-item>
                <el-form-item label="名称设置">
                    <div style="width: 100%;">
                        <div :style="{ color: form.textRgb, background: form.backGroundRgb, 'text-align': 'center','border-radius': '5px' }">
                            {{ form.name }}
                        </div>
                        <div style="padding: 10px 0;">
                            <el-progress :color="form.loadingRgb" :show-text="false" :percentage="70" />
                        </div>
                        <el-descriptions border :column="1" label-width="140">
                            <el-descriptions-item label="文字颜色">
                                <el-color-picker color-format="hex" v-model="form.textRgb" show-alpha :predefine="predefineColors" />
                            </el-descriptions-item>
                            <el-descriptions-item label="文字背景">
                                <el-color-picker color-format="hex" v-model="form.backGroundRgb" show-alpha :predefine="predefineColors" />
                            </el-descriptions-item>
                            <el-descriptions-item label="进度条颜色">
                                <el-color-picker color-format="hex" v-model="form.loadingRgb" show-alpha :predefine="predefineColors" />
                            </el-descriptions-item>
                        </el-descriptions>
                    </div>
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
                    <el-button @click="cancel">取 消</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="Vip" lang="ts">
import { listVip, getVip, delVip, addVip, updateVip } from '@/api/wxappUser/wxappUserLevel';
import { VipVO, VipQuery, VipForm } from '@/api/wxappUser/wxappUserLevel/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const vipList = ref<VipVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const vipFormRef = ref<ElFormInstance>();
const predefineColors = ref([
    '#ff4500',
    '#ff8c00',
    '#ffd700',
    '#90ee90',
    '#00ced1',
    '#1e90ff',
    '#c71585',
    'rgba(255, 69, 0, 0.68)',
    'rgb(255, 120, 0)',
    'hsv(51, 100, 98)',
    'hsva(120, 40, 94, 0.5)',
    'hsl(181, 100%, 37%)',
    'hsla(209, 100%, 56%, 0.73)',
    '#c7158577',
])
const dialog = reactive<DialogOption>({
    visible: false,
    title: ''
});

const initFormData: any = {
    id: undefined,
    level: undefined,
    name: undefined,
    icon: undefined,
    discountValue: undefined,
    needAmount: undefined,
    resultBalance: undefined,
    resultPrice: undefined,
    status: undefined,
    textRgb: undefined,
    backGroundRgb: undefined,
    loadingRgb: '#409EFF'
}
const data = reactive<any>({
    form: { ...initFormData },
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        level: undefined,
        name: undefined,
        icon: undefined,
        discountValue: undefined,
        needAmount: undefined,
        resultBalance: undefined,
        resultPrice: undefined,
        status: undefined,
        orderByColumn: "level",
        isAsc: "asc"
    },
    rules: {
        level: [
            { required: true, message: "vip等级不能为空", trigger: "blur" }
        ],
        name: [
            { required: true, message: "vip名称不能为空", trigger: "blur" }
        ],
        needAmount: [
            { required: true, message: "需求消费金额不能为空", trigger: "blur" }
        ],
        discountValue: [
            { required: true, message: "折扣率不能为空", trigger: "blur" }
        ],
        icon: [
            { required: true, message: "vip图标不能为空", trigger: "blur" }
        ],
    }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询vip信息列表 */
const getList = async () => {
    loading.value = true;
    const res = await listVip(queryParams.value);
    vipList.value = res.rows;
    total.value = res.total;
    loading.value = false;
}

/** 取消按钮 */
const cancel = () => {
    reset();
    dialog.visible = false;
}

/** 表单重置 */
const reset = () => {
    form.value = { ...initFormData };
    vipFormRef.value?.resetFields();
}

/** 搜索按钮操作 */
const handleQuery = () => {
    queryParams.value.pageNum = 1;
    getList();
}

/** 重置按钮操作 */
const resetQuery = () => {
    queryFormRef.value?.resetFields();
    handleQuery();
}


/** 新增按钮操作 */
const handleAdd = () => {
    reset();
    dialog.visible = true;
    dialog.title = "添加vip信息";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: VipVO) => {
    reset();
    const res = await getVip(row.id);
    Object.assign(form.value, res.data);
    dialog.visible = true;
    dialog.title = "修改vip信息";
}

/** 提交按钮 */
const submitForm = () => {
    vipFormRef.value?.validate(async (valid: boolean) => {
        if (valid) {
            buttonLoading.value = true;
            if (form.value.id) {
                await updateVip(form.value).finally(() => buttonLoading.value = false);
            } else {
                await addVip(form.value).finally(() => buttonLoading.value = false);
            }
            proxy?.$modal.msgSuccess("操作成功");
            dialog.visible = false;
            await getList();
        }
    });
}

/** 删除按钮操作 */
const handleDelete = async (row?: VipVO) => {
    const _ids = row?.id || ids.value;
    await proxy?.$modal.confirm('是否确认删除vip信息？').finally(() => loading.value = false);
    await delVip(_ids);
    proxy?.$modal.msgSuccess("删除成功");
    await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
    proxy?.download('system/vip/export', {
        ...queryParams.value
    }, `vip_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
    getList();
});
</script>
