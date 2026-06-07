<template>
    <div class="p-2">
        <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
            :leave-active-class="proxy?.animate.searchAnimate.leave">
            <div v-show="showSearch" class="mb-[10px]">
                <el-card shadow="hover">
                    <el-form ref="queryFormRef" :model="queryParams" :inline="true">
                        <el-form-item label="名称" prop="title">
                            <el-input v-model="queryParams.title" placeholder="请输入名称" clearable
                                @keyup.enter="handleQuery" />
                        </el-form-item>
                        <el-form-item label="地址" prop="address">
                            <el-input v-model="queryParams.address" placeholder="请输入地址" clearable
                                @keyup.enter="handleQuery" />
                        </el-form-item>
                        <el-form-item label="状态" prop="status">
                            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
                                <el-option v-for="dict in self_address_status" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-select>
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
                            v-hasPermi="['system:selfGetAddress:add']">新增</el-button>
                    </el-col>
                    <el-col :span="1.5">
                        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()"
                            v-hasPermi="['system:selfGetAddress:edit']">修改</el-button>
                    </el-col>
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
                </el-row>
            </template>

            <el-table v-loading="loading" border :data="selfGetAddressList">
                <el-table-column label="名称" align="center" prop="title" />
                <el-table-column label="地址" align="center" prop="address" />
                <el-table-column label="排序" align="center" prop="orders" />
                <el-table-column label="状态" align="center">
                    <template #default="scope">
                        <dict-tag :options="self_address_status" :value="scope.row.status" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center" fixed="right" class-name="small-padding fixed-width">
                    <template #default="scope">
                        <el-tooltip content="修改" placement="top">
                            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                                v-hasPermi="['system:selfGetAddress:edit']"></el-button>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                                v-hasPermi="['system:selfGetAddress:remove']"></el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>

            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-card>
        <!-- 添加或修改自提点对话框 -->
        <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
            <el-form ref="selfGetAddressFormRef" :model="form" :rules="rules" label-width="80px">
                <el-form-item label="名称" prop="title">
                    <el-input v-model="form.title" placeholder="请输入标题" />
                </el-form-item>
                <el-form-item label="地址" prop="address">
                    <el-input v-model="form.address" placeholder="请输入地址" />
                </el-form-item>
                <el-form-item label="排序" prop="orders">
                    <el-input v-model="form.orders" placeholder="请输入排序" />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="form.status">
                        <el-radio-button v-for="dict in self_address_status" :key="dict.value" :label="dict.label"
                            :value="dict.value" />
                    </el-radio-group>
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

<script setup name="SelfGetAddress" lang="ts">
import { listSelfGetAddress, getSelfGetAddress, delSelfGetAddress, addSelfGetAddress, updateSelfGetAddress } from '@/api/order/selfAddress';
import { SelfGetAddressVO, SelfGetAddressQuery, SelfGetAddressForm } from '@/api/order/selfAddress/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { self_address_status } = toRefs<any>(proxy?.useDict('self_address_status'));

const selfGetAddressList = ref<SelfGetAddressVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const selfGetAddressFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
    visible: false,
    title: ''
});

const initFormData: any = {
    id: undefined,
    address: undefined,
    status: undefined,
    orders: undefined,
    title: undefined
}
const data = reactive<any>({
    form: { ...initFormData },
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        address: undefined,
        status: undefined,
        orders: undefined,
        orderByColumn: 'orders',
        isAsc: 'desc'
    },
    rules: {
        title: [
            { required: true, message: "标题不能为空", trigger: "blur" }
        ],
        address: [
            { required: true, message: "地址不能为空", trigger: "blur" }
        ],
        status: [
            { required: true, message: "不能为空", trigger: "change" }
        ],
    }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询自提点列表 */
const getList = async () => {
    loading.value = true;
    const res = await listSelfGetAddress(queryParams.value);
    selfGetAddressList.value = res.rows;
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
    selfGetAddressFormRef.value?.resetFields();
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

/** 多选框选中数据 */
const handleSelectionChange = (selection: SelfGetAddressVO[]) => {
    ids.value = selection.map(item => item.id);
    single.value = selection.length != 1;
    multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
    reset();
    dialog.visible = true;
    dialog.title = "添加自提点";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: SelfGetAddressVO) => {
    reset();
    const _id = row?.id || ids.value[0]
    const res = await getSelfGetAddress(_id);
    Object.assign(form.value, res.data);
    dialog.visible = true;
    dialog.title = "修改自提点";
}

/** 提交按钮 */
const submitForm = () => {
    selfGetAddressFormRef.value?.validate(async (valid: boolean) => {
        if (valid) {
            buttonLoading.value = true;
            if (form.value.id) {
                await updateSelfGetAddress(form.value).finally(() => buttonLoading.value = false);
            } else {
                await addSelfGetAddress(form.value).finally(() => buttonLoading.value = false);
            }
            proxy?.$modal.msgSuccess("操作成功");
            dialog.visible = false;
            await getList();
        }
    });
}

/** 删除按钮操作 */
const handleDelete = async (row?: SelfGetAddressVO) => {
    const _ids = row?.id || ids.value;
    await proxy?.$modal.confirm('是否确认删除自提点编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
    await delSelfGetAddress(_ids);
    proxy?.$modal.msgSuccess("删除成功");
    await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
    proxy?.download('system/selfGetAddress/export', {
        ...queryParams.value
    }, `selfGetAddress_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
    getList();
});
</script>
