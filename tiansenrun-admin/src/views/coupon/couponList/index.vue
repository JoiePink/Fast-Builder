<template>
    <div class="p-2">
        <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
            :leave-active-class="proxy?.animate.searchAnimate.leave" @submit.native.prevent>
            <div v-show="showSearch" class="mb-[10px]">
                <el-card shadow="hover">
                    <el-form ref="queryFormRef" :model="queryParams" label-width="90" :inline="true">
                        <el-form-item label="优惠券名称" prop="couponName">
                            <el-input v-model="queryParams.couponName" placeholder="请输入优惠券名称" clearable
                                @keyup.enter="handleQuery" />
                        </el-form-item>
                        <el-form-item label="优惠券类型" prop="couponType">
                            <el-select v-model="queryParams.couponType" placeholder="请选择优惠券类型" clearable>
                                <el-option v-for="dict in coupon_type" :key="dict.value" :label="dict.label"
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
                            v-hasPermi="['forest:coupon:add']">新增</el-button>
                    </el-col>
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
                </el-row>
            </template>

            <el-table v-loading="loading" border :data="couponList">
                <el-table-column label="优惠券名称" align="center" prop="couponName" />
                <el-table-column label="使用要求金额" align="center" prop="needAmount" />
                <el-table-column label="优惠券类型" align="center" prop="couponType">
                    <template #default="scope">
                        <dict-tag :options="coupon_type" :value="scope.row.couponType" />
                    </template>
                </el-table-column>
                <el-table-column label="抵扣金额/折扣值" align="center" prop="disAmount">
                    <template #default="scope">
                        <el-tag v-if="scope.row.couponType == 1">
                            {{ scope.row.disAmount }}元
                        </el-tag>
                        <el-tag v-else>
                            {{ scope.row.disValue }}%
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="发放次数" align="center" prop="publishCount" />
                <el-table-column label="发放数量" align="center" prop="publishTotal" />
                <el-table-column label="操作" align="center" fixed="right" class-name="small-padding fixed-width">
                    <template #default="scope">
                        <el-tooltip content="修改" placement="top">
                            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                                v-hasPermi="['forest:coupon:edit']"></el-button>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                                v-hasPermi="['forest:coupon:remove']"></el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>

            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-card>

        <!-- 添加或修改优惠劵信息对话框 -->
        <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
            <el-form ref="couponFormRef" :model="form" :rules="rules" label-width="110">
                <el-form-item label="优惠券类型" prop="couponType">
                    <el-select v-model="form.couponType" placeholder="请选择优惠券类型" @change="couponTypeChange">
                        <el-option v-for="dict in coupon_type" :key="dict.value" :label="dict.label"
                            :value="dict.value * 1" />
                    </el-select>
                </el-form-item>
                <el-form-item label="优惠券名称" prop="couponName">
                    <el-input v-model="form.couponName" placeholder="请输入优惠券名称" />
                </el-form-item>
                <el-form-item label="使用要求金额" prop="needAmount">
                    <el-input-number :min="0" :controls="false" class="inputLeft" v-model="form.needAmount"
                        placeholder="请输入使用要求金额" />
                </el-form-item>
                <el-form-item label="抵扣金额" prop="disAmount" v-if="form.couponType == 1">
                    <el-input-number :min="0" :controls="false" class="inputLeft"
                        v-model="form.disAmount" placeholder="请输入抵扣金额">
                        <template #suffix>元</template>
                    </el-input-number>
                </el-form-item>
                <el-form-item label="折扣值" prop="disValue" v-if="form.couponType == 2">
                    <el-input-number :min="1" :max="100" :controls="false" class="inputLeft"
                        v-model="form.disValue" placeholder="请输入折扣值">
                        <template #suffix>%</template>
                    </el-input-number>
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

<script setup name="Coupon" lang="ts">
import { listCoupon, getCoupon, delCoupon, addCoupon, updateCoupon } from '@/api/coupon/couponList';
import { CouponVO, CouponQuery, CouponForm } from '@/api/coupon/couponList/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { coupon_type } = toRefs<any>(proxy?.useDict('coupon_type'));

const couponList = ref<CouponVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const couponFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
    visible: false,
    title: ''
});

const initFormData: CouponForm = {
    id: undefined,
    couponName: undefined,
    couponImg: undefined,
    couponType: undefined,
    needAmount: undefined,
    disAmount: undefined,
    disValue: undefined,
    publishCount: undefined,
    publishTotal: undefined
}
const data = reactive<PageData<CouponForm, CouponQuery>>({
    form: { ...initFormData },
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        couponName: undefined,
        couponImg: undefined,
        couponType: undefined,
        needAmount: undefined,
        disAmount: undefined,
        disValue: undefined,
        publishCount: undefined,
        publishTotal: undefined,
    },
    rules: {
        couponName: [{ required: true, message: "优惠券名称不能为空", trigger: "blur" }],
        couponType: [{ required: true, message: "优惠券类型不能为空", trigger: "change" }],
        disAmount: [{ required: true, message: "抵扣金额不能为空", trigger: "blur" }],
        disValue: [{ required: true, message: "折扣值不能为空", trigger: "blur" }],
        needAmount: [{ required: true, message: "使用要求金额不能为空", trigger: "blur" }],
    }
});

const { queryParams, form, rules } = toRefs(data);

const couponTypeChange = (value: any) => {
    form.value.disAmount = undefined;
    form.value.disValue = undefined;
    setTimeout(_ => {
        couponFormRef.value?.clearValidate();
    })
}

/** 查询优惠劵信息列表 */
const getList = async () => {
    loading.value = true;
    const res = await listCoupon(queryParams.value);
    couponList.value = res.rows;
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
    couponFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: CouponVO[]) => {
    ids.value = selection.map(item => item.id);
    single.value = selection.length != 1;
    multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
    reset();
    dialog.visible = true;
    dialog.title = "添加优惠劵信息";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: CouponVO) => {
    reset();
    const _id = row?.id || ids.value[0]
    const res = await getCoupon(_id);
    Object.assign(form.value, res.data);
    dialog.visible = true;
    dialog.title = "修改优惠劵信息";
}

/** 提交按钮 */
const submitForm = () => {
    couponFormRef.value?.validate(async (valid: boolean) => {
        if (valid) {
            buttonLoading.value = true;
            if (form.value.id) {
                await updateCoupon(form.value).finally(() => buttonLoading.value = false);
            } else {
                await addCoupon(form.value).finally(() => buttonLoading.value = false);
            }
            proxy?.$modal.msgSuccess("操作成功");
            dialog.visible = false;
            await getList();
        }
    });
}

/** 删除按钮操作 */
const handleDelete = async (row?: CouponVO) => {
    const _ids = row?.id || ids.value;
    await proxy?.$modal.confirm('是否确认删除优惠劵信息编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
    await delCoupon(_ids);
    proxy?.$modal.msgSuccess("删除成功");
    await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
    proxy?.download('system/coupon/export', {
        ...queryParams.value
    }, `coupon_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
    getList();
});
</script>
