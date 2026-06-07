<template>
    <div class="p-2">
        <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
            :leave-active-class="proxy?.animate.searchAnimate.leave">
            <div v-show="showSearch" class="mb-[10px]">
                <el-card shadow="hover">
                    <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="100">
                        <el-form-item label="订单号" prop="orderNo">
                            <el-input v-model="queryParams.orderNo" placeholder="请输入订单号" clearable
                                @keyup.enter="handleQuery" />
                        </el-form-item>
                        <el-form-item label="状态" prop="status">
                            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
                                <el-option v-for="dict in order_refund_status" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="退款类型" prop="refundType">
                            <el-select v-model="queryParams.refundType" placeholder="请选择退款类型" clearable>
                                <el-option v-for="dict in order_refund_type" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="下单用户" prop="userName">
                            <el-select filterable v-model="queryParams.userName" placeholder="请选择下单用户" clearable>
                                <el-option v-for="item in userList" :key="item.id" :label="item.nickName"
                                    :value="item.nickName" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="收货人" prop="acceptName">
                            <el-input v-model="queryParams.acceptName" placeholder="请输入收货人" clearable
                                @keyup.enter="handleQuery" />
                        </el-form-item>
                        <el-form-item label="收货人电话" prop="acceptMobile">
                            <el-input v-model="queryParams.acceptMobile" placeholder="请输入收货人电话" clearable
                                @keyup.enter="handleQuery" />
                        </el-form-item>
                        <el-form-item label="配送方式" prop="shippingType">
                            <el-select v-model="queryParams.shippingType" placeholder="请选择配送方式" clearable>
                                <el-option v-for="dict in order_shipping_type" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="商品名称" prop="productRemarkValue">
                            <el-input v-model="queryParams.productRemarkValue" placeholder="请输入商品名称" clearable
                                @keyup.enter="handleQuery" />
                        </el-form-item>
                        <el-form-item label="创建时间">
                            <el-date-picker class="serarchInput" v-model="dateRange" value-format="YYYY-MM-DD HH:mm:ss"
                                type="daterange" range-separator="-" start-placeholder="开始日期"
                                end-placeholder="结束日期"></el-date-picker>
                        </el-form-item>
                        <el-form-item label="物流单号" prop="trackingNo">
                            <el-input v-model="queryParams.trackingNo" placeholder="请输入物流单号" clearable
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
                        <el-button type="info" plain icon="Sort" @click="toggleExpand">展开/折叠</el-button>
                    </el-col>
                    <el-col :span="1.5">
                        <el-button type="warning" plain icon="Download" @click="handleExport">导出</el-button>
                    </el-col>
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
                </el-row>
            </template>

            <el-table ref="tableRef" v-loading="loading" border :data="orderRefundList">
                <el-table-column type="expand">
                    <template #default="scope">
                        <div style="padding:10px 20px;">
                            <el-table v-loading="loading" border :data="scope.row.orderDetail.orderProducts">
                                <el-table-column label="商品名称" align="center" prop="productName" />
                                <el-table-column label="商品图片" align="center">
                                    <template #default="scopeRow">
                                        <image-preview :src="scopeRow.row.imageUrl" :width="50" :height="50" />
                                    </template>
                                </el-table-column>
                                <el-table-column label="规格" align="center" prop="skuName" />
                                <el-table-column label="购买数量" align="center" prop="skuCount" />
                                <el-table-column label="总金额" align="center" prop="amount" />
                                <el-table-column label="奖励积分" align="center" prop="totalRewardBalance" />
                            </el-table>
                            <el-descriptions :column="4" label-width="120" style="margin-top: 10px; padding: 0 10px;">
                                <el-descriptions-item label="订单号" width="25%">
                                    {{ scope.row.orderDetail.orderNo }}
                                </el-descriptions-item>
                                <el-descriptions-item label="配送方式" width="25%">
                                    {{ scope.row.orderDetail.shippingType == 0 ? '物流' : '用户自提' }}
                                </el-descriptions-item>
                                <el-descriptions-item v-if="scope.row.orderDetail.shippingType == 0" label="收货人" width="25%">
                                    {{ scope.row.orderDetail.acceptName }}-{{ scope.row.orderDetail.acceptMobile }}
                                </el-descriptions-item>
                                <el-descriptions-item v-if="scope.row.orderDetail.shippingType == 1" label="自提点" width="25%">
                                    {{ scope.row.orderDetail.selfGetTitle }}-{{ scope.row.orderDetail.selfGetAddress }}
                                </el-descriptions-item>
                                <el-descriptions-item label="收货地址" width="25%">
                                    {{ scope.row.orderDetail.address }}
                                </el-descriptions-item>
                                <el-descriptions-item label="总金额" width="25%">
                                    ￥{{ scope.row.orderDetail.totalAmount }}
                                </el-descriptions-item>
                                <el-descriptions-item label="会员抵扣金额" width="25%">
                                    ￥{{ scope.row.orderDetail.vipDiscountAmount }}
                                </el-descriptions-item>
                                <el-descriptions-item label="优惠券抵扣金额" width="25%">
                                    ￥{{ scope.row.orderDetail.couponAmount }}{{ scope.row.orderDetail.couponName ? `
                                    <${scope.row.orderDetail.couponName}>` :
                                        '' }}
                                </el-descriptions-item>
                                <el-descriptions-item label="总抵扣金额" width="25%">
                                    ￥{{ scope.row.orderDetail.discountAmount }}
                                </el-descriptions-item>
                                <el-descriptions-item label="下单用户" width="25%">
                                    {{ scope.row.orderDetail.userName }}
                                </el-descriptions-item>
                                <el-descriptions-item label="下单时间" width="25%">
                                    {{ scope.row.orderDetail.createTime || '-----' }}
                                </el-descriptions-item>
                                <el-descriptions-item label="支付时间" width="25%">
                                    {{ scope.row.orderDetail.payTime || '-----' }}
                                </el-descriptions-item>
                                <el-descriptions-item label="发货时间" width="25%">
                                    {{ scope.row.orderDetail.deliveryTime || '-----' }}
                                </el-descriptions-item>
                                <!-- <el-descriptions-item label="完成时间" width="25%">
                                    {{ scope.row.orderDetail.finishTime }}
                                </el-descriptions-item> -->
                                <el-descriptions-item label="订单商品描述" width="25%">
                                    {{ scope.row.orderDetail.productRemarkValue }}
                                </el-descriptions-item>
                                <!-- <el-descriptions-item label="过期时间" width="25%">
                                    {{ scope.row.orderDetail.expireTime }}
                                </el-descriptions-item> -->
                            </el-descriptions>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="退款订单号" align="center" prop="orderNo" width="200" />
                <el-table-column label="退款状态" align="center" prop="status">
                    <template #default="scope">
                        <dict-tag :options="order_refund_status" :value="scope.row.status" />
                    </template>
                </el-table-column>
                <el-table-column label="退款类型" align="center" prop="refundType">
                    <template #default="scope">
                        <dict-tag :options="order_refund_type" :value="scope.row.refundType" />
                    </template>
                </el-table-column>
                <el-table-column show-overflow-tooltip label="退款原因" align="center" prop="userDetail" />
                <el-table-column show-overflow-tooltip label="用户备注" align="center" prop="remark" />
                <el-table-column label="退款图片" align="center">
                    <template #default="scopeRow">
                        <image-preview v-if="scopeRow.row.imageUrl" :src="scopeRow.row.imageUrl" :width="50"
                            :height="50" />
                    </template>
                </el-table-column>
                <el-table-column label="订单金额" align="center" prop="orderDetail.realAmount" />
                <el-table-column label="退款金额" align="center" prop="refundAmount">
                    <template #default="scope">
                        {{ scope.row.status == 2 ? scope.row.refundAmount : '--' }}
                    </template>
                </el-table-column>
                <el-table-column label="物流单号" align="center" prop="trackingNo" />
                <el-table-column show-overflow-tooltip label="审批备注" align="center" prop="serverDetail" />
                <el-table-column label="操作" align="center" fixed="right" class-name="small-padding fixed-width">
                    <template #default="scope">
                        <el-button v-if="scope.row.status == 0" link type="primary" icon="Stamp" @click="orderRefundOpen(scope.row)">审批</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-card>

        <!-- 订单退款审批 -->
        <el-dialog v-model="orderRefund.open" :title="orderRefund.title" width="500px">
            <el-form ref="orderRefundRef" :model="form" :rules="rules" label-width="80">
                <el-form-item label="退款" prop="refund">
                    <el-radio-group v-model="form.refund">
                        <el-radio-button label="同意" :value="true" />
                        <el-radio-button label="拒绝" :value="false" />
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="优惠劵" prop="rollBackCoupon" v-if="form.coupon">
                    <el-radio-group v-model="form.rollBackCoupon">
                        <el-radio-button label="返还" :value="true" />
                        <el-radio-button label="不返还" :value="false" />
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="退款金额" prop="refundAmount">
                    <el-input-number :min="0" :max="form.max" :controls="false" class="inputLeft"
                        v-model="form.refundAmount" placeholder="请输入退款金额" />
                </el-form-item>
                <el-form-item label="审批备注" prop="serverDetail">
                    <el-input type="textarea" v-model="form.serverDetail" placeholder="请输入审批备注" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button :loading="buttonLoading" type="primary" @click="orderRefundSubmit">确 定</el-button>
                    <el-button @click="orderRefundClose">取 消</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="OrderRefund" lang="ts">
import { listOrderRefund, getOrderRefund, orderRefundVerify } from '@/api/order/orderRefund';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { order_refund_status, order_refund_type, order_shipping_type } = toRefs<any>(proxy?.useDict('order_refund_status', 'order_refund_type', 'order_shipping_type'));

const orderRefundList = ref<any>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const total = ref(0);
const dateRange = ref<any>(['', '']);

const queryFormRef = ref<any>();

// 用户列表
import { listUser } from '@/api/wxappUser/wxappUserList';
const userList = ref([]);
const getUserList = () => {
    listUser().then(res => {
        userList.value = res.rows;
    })
};
getUserList()

const data = reactive<any>({
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: undefined,
        orderId: undefined,
        orderType: undefined,
        refundAmount: undefined,
        images: undefined,
        userDetail: undefined,
        refundWechatSendValue: undefined,
        refundWechatResultValue: undefined,
        status: undefined,
        orderNo: undefined,
        serverDetail: undefined,
        refundType: undefined,
        trackingNo: undefined,
        image: undefined,
        orderByColumn: 'createTime',
        isAsc: 'desc'
    },
});
const { queryParams } = toRefs(data);

const initFormData: any = {
    id: undefined,
    serverDetail: undefined,
    refund: undefined,
    rollBackCoupon: false,
    coupon: undefined,
    refundAmount: undefined,
}
const orderRefundRef = ref(null);
const orderRefund = reactive({
    open: false,
    title: '订单退款审批',
    form: { ...initFormData },
    rules: {
        refund: [
            { required: true, message: "不能为空", trigger: "change" }
        ],
        refundAmount: [
            { required: true, message: "不能为空", trigger: "blur" }
        ]
    }
});
const { form, rules } = toRefs(orderRefund);
const orderRefundOpen = (row: any) => {
    reset();
    orderRefund.open = true;
    form.value.id = row.id;
    form.value.refundAmount = row.orderDetail.realAmount;
    form.value.max = row.orderDetail.realAmount;
    if (row.orderDetail.userCouponId == 0) {
        form.value.coupon = false;
    } else {
        form.value.coupon = true;
    }
};
const orderRefundClose = () => {
    orderRefund.open = false;
    reset();
};
const orderRefundSubmit = () => {
    orderRefundRef.value?.validate((valid: boolean) => {
        if (valid) {
            buttonLoading.value = true;
            orderRefundVerify(form.value).then(res => {
                proxy?.$modal.msgSuccess("操作成功");
                orderRefund.open = false;
                getList();
            }).finally(() => buttonLoading.value = false);
        }
    });
}
// 订单展开
const tableRef = ref(null);
const tableExpand = ref(false)
const toggleExpand = () => {
    tableExpand.value = !tableExpand.value
    orderRefundList.value.map(item => {
        tableRef.value.toggleRowExpansion(item, tableExpand.value)
    })
}

/** 查询用户订单退款信息列表 */
import { reconstructDateRange } from '@/utils/ruoyi';
const getList = async () => {
    loading.value = true;
    const res = await listOrderRefund(reconstructDateRange(queryParams.value, dateRange.value, 'createTimeBegin', 'createTimeEnd'));
    orderRefundList.value = res.rows;
    total.value = res.total;
    loading.value = false;
}


/** 表单重置 */
const reset = () => {
    form.value = { ...initFormData };
    orderRefundRef.value?.resetFields();
}

/** 搜索按钮操作 */
const handleQuery = () => {
    queryParams.value.pageNum = 1;
    getList();
}

/** 重置按钮操作 */
const resetQuery = () => {
    queryFormRef.value?.resetFields();
    dateRange.value = ['', ''];
    handleQuery();
}


/** 修改按钮操作 */
const handleUpdate = async (row?: any) => {
    reset();
    const _id = row?.id || ids.value[0]
    const res = await getOrderRefund(_id);
    Object.assign(form.value, res.data);
}

/** 导出按钮操作 */
const handleExport = () => {
    let subData = JSON.parse(JSON.stringify(queryParams.value));
    delete subData.pageNum;
    delete subData.pageSize;
    proxy?.download('admin/order/refund/export', {
        ...subData
    }, `退款订单_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
    getList();
});
</script>
