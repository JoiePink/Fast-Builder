<template>
    <div class="p-2">
        <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
            :leave-active-class="proxy?.animate.searchAnimate.leave">
            <div v-show="showSearch" class="mb-[10px]">
                <el-card shadow="hover">
                    <el-form ref="queryFormRef" :model="queryParams" :inline="true">
                        <el-form-item label="状态" prop="status">
                            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
                                <el-option v-for="dict in coupon_activity_status" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="优惠劵" prop="couponId">
                            <el-select v-model="queryParams.couponId" placeholder="请选择优惠劵" clearable>
                                <el-option v-for="dict in couponList" :key="dict.id"
                                    :label="`${dict.couponName}-${dict.couponType == 1 ? '抵扣' : '折扣'}券-${dict.couponType == 1 ? dict.disAmount + '元' : dict.disValue + '%'}`"
                                    :value="dict.id" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="开始时间" prop="startTime">
                            <el-date-picker value-format="YYYY-MM-DD HH:mm:ss" v-model="queryParams.startTime" type="date" placeholder="请选择开始时间" />
                        </el-form-item>
                        <el-form-item label="过期时间" prop="expireTime">
                            <el-date-picker value-format="YYYY-MM-DD HH:mm:ss" v-model="queryParams.expireTime" type="date" placeholder="请选择过期时间" />
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
                            v-hasPermi="['forest:activity:add']">新增</el-button>
                    </el-col>
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
                </el-row>
            </template>

            <el-table v-loading="loading" border :data="couponActivityList">
                <el-table-column label="优惠劵" align="center" prop="couponName" />
                <el-table-column label="发布数量" align="center" prop="limitTotal" />
                <el-table-column label="开始时间" align="center" prop="startTime" width="180">
                    <!-- <template #default="scope">
                        <span>{{ parseTime(scope.row.startTime, '{y}-{m}-{d}') }}</span>
                    </template> -->
                </el-table-column>
                <el-table-column label="过期时间" align="center" prop="expireTime" width="180">
                    <!-- <template #default="scope">
                        <span>{{ parseTime(scope.row.expireTime, '{y}-{m}-{d}') }}</span>
                    </template> -->
                </el-table-column>
                <el-table-column label="活动详情" show-overflow-tooltip align="center" prop="activityDetail" />
                <el-table-column label="状态" align="center" prop="status">
                    <template #default="scope">
                        <dict-tag :options="coupon_activity_status" :value="scope.row.status" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center" fixed="right" class-name="small-padding fixed-width">
                    <template #default="scope">
                        <el-tooltip content="修改" placement="top">
                            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                                v-hasPermi="['forest:activity:edit']"></el-button>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                                v-hasPermi="['forest:activity:remove']"></el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>

            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-card>

        <!-- 添加或修改优惠劵领取活动对话框 -->
        <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
            <el-form ref="couponActivityFormRef" :model="form" :rules="rules" label-width="80px">
                <el-form-item label="优惠劵" prop="couponId">
                    <el-select v-model="form.couponId" placeholder="请选择优惠劵" clearable>
                        <el-option v-for="dict in couponList" :key="dict.id"
                            :label="`${dict.couponName}-${dict.couponType == 1 ? '抵扣' : '折扣'}券-${dict.couponType == 1 ? dict.disAmount + '元' : dict.disValue + '%'}`"
                            :value="dict.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="发布数量" prop="limitTotal">
                    <el-input-number :min="0" :precision="0" :controls="false" class="inputLeft"
                        v-model="form.limitTotal" placeholder="请输入总发布限量" />
                </el-form-item>
                <el-form-item label="开始时间" prop="startTime">
                    <el-date-picker class="inputLeft" clearable v-model="form.startTime" type="datetime"
                        value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择开始时间">
                    </el-date-picker>
                </el-form-item>
                <el-form-item label="过期时间" prop="expireTime">
                    <el-date-picker class="inputLeft" clearable v-model="form.expireTime" type="datetime"
                        value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择过期时间">
                    </el-date-picker>
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="form.status">
                        <el-radio-button v-for="dict in coupon_activity_status" :key="dict.value" :label="dict.label"
                            :value="dict.value" />
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="活动详情" prop="activityDetail">
                    <el-input v-model="form.activityDetail" type="textarea" placeholder="请输入内容" />
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

<script setup name="CouponActivity" lang="ts">
import { listCouponActivity, getCouponActivity, delCouponActivity, addCouponActivity, updateCouponActivity } from '@/api/coupon/couponActivity';
import { CouponActivityVO, CouponActivityQuery, CouponActivityForm } from '@/api/coupon/couponActivity/types';
import { listCoupon } from '@/api/coupon/couponList';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { coupon_activity_status } = toRefs<any>(proxy?.useDict('coupon_activity_status'));
const couponActivityList = ref<CouponActivityVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const couponActivityFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
    visible: false,
    title: ''
});

const initFormData: CouponActivityForm = {
    id: undefined,
    couponId: undefined,
    limitTotal: undefined,
    startTime: undefined,
    expireTime: undefined,
    activityDetail: undefined,
    status: '0',
}
const data = reactive<any>({
    form: { ...initFormData },
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        couponId: undefined,
        limitTotal: undefined,
        startTime: undefined,
        expireTime: undefined,
        activityDetail: undefined,
        status: undefined,
    },
    rules: {
        couponId: [
            { required: true, message: "优惠劵不能为空", trigger: "blur" }
        ],
        limitTotal: [
            { required: true, message: "发布数量不能为空", trigger: "blur" }
        ],
        startTime: [
            { required: true, message: "开始时间不能为空", trigger: "blur" }
        ],
        expireTime: [
            { required: true, message: "过期时间不能为空", trigger: "blur" }
        ],
    }
});

const { queryParams, form, rules } = toRefs(data);

const couponList = ref([])
const getCouponList = () => {
    listCoupon().then(res => {
        couponList.value = res.rows;
    })
}
getCouponList();
/** 查询优惠劵领取活动列表 */
const getList = async () => {
    loading.value = true;
    const res = await listCouponActivity(queryParams.value);
    couponActivityList.value = res.rows;
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
    couponActivityFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: CouponActivityVO[]) => {
    ids.value = selection.map(item => item.id);
    single.value = selection.length != 1;
    multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
    reset();
    dialog.visible = true;
    dialog.title = "添加优惠劵领取活动";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: CouponActivityVO) => {
    reset();
    const _id = row?.id || ids.value[0]
    const res = await getCouponActivity(_id);
    Object.assign(form.value, res.data);
    dialog.visible = true;
    dialog.title = "修改优惠劵领取活动";
}

/** 提交按钮 */
const submitForm = () => {
    couponActivityFormRef.value?.validate(async (valid: boolean) => {
        if (valid) {
            buttonLoading.value = true;
            if (form.value.id) {
                await updateCouponActivity(form.value).finally(() => buttonLoading.value = false);
            } else {
                await addCouponActivity(form.value).finally(() => buttonLoading.value = false);
            }
            proxy?.$modal.msgSuccess("操作成功");
            dialog.visible = false;
            await getList();
        }
    });
}

/** 删除按钮操作 */
const handleDelete = async (row?: CouponActivityVO) => {
    const _ids = row?.id || ids.value;
    await proxy?.$modal.confirm('是否确认删除优惠劵领取活动编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
    await delCouponActivity(_ids);
    proxy?.$modal.msgSuccess("删除成功");
    await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
    proxy?.download('system/couponActivity/export', {
        ...queryParams.value
    }, `couponActivity_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
    getList();
});
</script>
