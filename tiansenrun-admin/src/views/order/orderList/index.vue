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
                        <el-form-item label="状态" prop="orderStatus">
                            <el-select v-model="queryParams.orderStatus" placeholder="请选择状态" clearable>
                                <el-option v-for="dict in order_status" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="下单用户" prop="appUserId">
                            <el-select filterable v-model="queryParams.appUserId" placeholder="请选择下单用户" clearable>
                                <el-option v-for="item in userList" :key="item.id" :label="item.nickName"
                                    :value="item.id" />
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
            <el-table ref="tableRef" v-loading="loading" border :data="orderList" preserve-expanded-content
                :default-expand-all="tableExpand" @expand-change="expandFn">
                <el-table-column type="expand">
                    <template #default="scope">
                        <div style="padding:10px 20px;">
                            <el-table v-loading="loading" border :data="scope.row.orderProducts">
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
                            <!-- <div class="table-expand-list">
                                <div class="tel-item">
                                    <div class="tel-i-label"></div>
                                    <div class="tel-i-value"></div>
                                </div>
                            </div> -->
                            <el-descriptions :column="4" label-width="120" style="margin-top: 10px; padding: 0 10px;">
                                <el-descriptions-item label="总金额" width="25%">￥{{ scope.row.totalAmount
                                }}</el-descriptions-item>
                                <el-descriptions-item label="会员抵扣金额" width="25%">￥{{ scope.row.vipDiscountAmount
                                }}</el-descriptions-item>
                                <el-descriptions-item label="优惠券抵扣金额" width="25%">￥{{ scope.row.couponAmount }}{{
                                    scope.row.couponName ? `
                                    <${scope.row.couponName}>` : '' }}
                                </el-descriptions-item>
                                <el-descriptions-item label="总抵扣金额" width="25%">￥{{ scope.row.discountAmount
                                }}</el-descriptions-item>
                                <!-- 2026-02-10：辉哥说不要显示签到奖励 -->
                                <!-- <el-descriptions-item label="签到总奖励" width="25%">
                                    ￥{{ scope.row.rewardAmount || '--' }}
                                </el-descriptions-item>
                                <el-descriptions-item label="已获取的签到奖励" width="25%">
                                    ￥{{ scope.row.signInAmount || '--' }}
                                </el-descriptions-item> -->
                                <el-descriptions-item label="下单用户" width="25%">
                                    {{ scope.row.userName }}
                                </el-descriptions-item>
                                <el-descriptions-item label="支付时间" width="25%">
                                    {{ scope.row.payTime || '-----' }}
                                </el-descriptions-item>
                                <el-descriptions-item label="发货时间" width="25%">
                                    {{ scope.row.deliveryTime || '-----' }}
                                </el-descriptions-item>
                                <el-descriptions-item label="完成时间" width="25%">
                                    {{ scope.row.finishTime || '-----' }}
                                </el-descriptions-item>
                                <el-descriptions-item v-for="item in scope.row.inviteRewards" :key="item.userId" :label="`${item.level}级分销返利`" width="25%">
                                    {{ item.nickName }} - ￥{{ item.amount }}
                                </el-descriptions-item>
                                <el-descriptions-item label="订单商品描述" width="25%">
                                    {{ scope.row.productRemarkValue }}
                                </el-descriptions-item>
                            </el-descriptions>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="订单号" align="center" prop="orderNo" width="200" />
                <el-table-column label="订单状态" align="center" prop="orderStatus" width="200">
                    <template #default="scope">
                        <div style="display: flex; align-items: center; justify-content: center;">
                            <dict-tag :options="order_status" :value="scope.row.orderStatus" />
                            <dict-tag :options="order_shipping_type" :value="scope.row.shippingType" />
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="实际金额" align="center" prop="realAmount" width="100" />
                <el-table-column show-overflow-tooltip label="收货人/自提点" align="center" prop="userName" width="200">
                    <template #default="scope">
                        <span v-if="scope.row.shippingType == 0">{{ scope.row.acceptName }} - {{ scope.row.acceptMobile
                        }}</span>
                        <span v-if="scope.row.shippingType == 1">{{ scope.row.selfGetTitle }}</span>
                    </template>
                </el-table-column>
                <el-table-column show-overflow-tooltip label="收货地址/自提地址" align="center" prop="address">
                    <template #default="scope">
                        <span v-if="scope.row.shippingType == 0">{{ scope.row.address }}</span>
                        <span v-if="scope.row.shippingType == 1">{{ scope.row.selfGetAddress }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="下单时间" align="center" prop="createTime" width="180">
                </el-table-column>
                <el-table-column label="操作" align="center" fixed="right" class-name="small-padding fixed-width"
                    width="200">
                    <template #default="scope">
                        <el-button link type="primary" icon="Van"
                            v-if="scope.row.orderStatus == 1 && scope.row.shippingType == 1"
                            @click="orderSendZT(scope.row)" v-hasPermi="['forest:order:shipping']">自提发货</el-button>
                        <el-button link type="primary" icon="Van"
                            v-if="scope.row.orderStatus == 2 && scope.row.shippingType == 1"
                            @click="orderZTHX(scope.row)" v-hasPermi="['forest:order:shipping']">自提核销</el-button>
                        <el-button link type="primary" icon="Van"
                            v-if="scope.row.orderStatus == 1 && scope.row.shippingType == 0"
                            @click="orderSendOpen(scope.row)" v-hasPermi="['forest:order:shipping']">订单发货</el-button>
                        <el-button link type="primary" icon="Van"
                            v-if="(scope.row.orderStatus == 2 || scope.row.orderStatus == 3) && scope.row.shippingType == 0"
                            @click="orderSendDetailOpen(scope.row)"
                            v-hasPermi="['forest:order:shipping']">发货详情</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-card>

        <!-- 订单发货 -->
        <el-dialog :title="orderSend.title" v-model="orderSend.open" width="600" append-to-body destroy-on-close>
            <el-form ref="orderSendRef" :model="orderSend.form" :rules="orderSend.rules" label-width="100">
                <el-form-item label="快递公司" prop="company">
                    <el-select filterable v-model="orderSend.form.company" @change="expressChange" placeholder="请选择快递公司"
                        clearable>
                        <el-option v-for="item in expressCompanyList" :key="item.id" :label="item.name"
                            :value="item.code" />
                    </el-select>
                </el-form-item>
                <el-form-item label="快递单号" prop="number">
                    <el-input v-model="orderSend.form.number" placeholder="请输入快递单号" />
                </el-form-item>
                <el-form-item label="出发地" prop="fromValue">
                    <el-input v-model="orderSend.form.fromValue" placeholder="请输入出发地" />
                </el-form-item>
                <el-form-item label="目的地" prop="toValue">
                    <el-input v-model="orderSend.form.toValue" placeholder="请输入目的地" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button :loading="buttonLoading" type="primary" @click="orderSendSub">确 定</el-button>
                    <el-button @click="orderSendClose">取 消</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 订单发货详情 -->
        <el-dialog :title="orderSendDetail.title" v-model="orderSendDetail.open" width="600" append-to-body
            destroy-on-close>
            <el-descriptions :column="1" label-width="120" style="margin-top: 10px; padding: 0 10px;">
                <el-descriptions-item label="快递公司">
                    {{ orderSendDetail.form.companyName }}
                </el-descriptions-item>
                <el-descriptions-item label="快递单号">
                    {{ orderSendDetail.form.number }}
                </el-descriptions-item>
                <el-descriptions-item label="出发地">
                    {{ orderSendDetail.form.fromValue }}
                </el-descriptions-item>
                <el-descriptions-item label="目的地">
                    {{ orderSendDetail.form.toValue }}
                </el-descriptions-item>
                <el-descriptions-item label="发货时间">
                    {{ orderSendDetail.form.createTime }}
                </el-descriptions-item>
            </el-descriptions>
            <el-timeline style="margin-top: 10px; padding-left: 10px;">
                <el-timeline-item v-for="(item, index) in orderSendDetail.form.line" :key="index"
                    :timestamp="item.aboutTime">
                    {{ item.context }}
                </el-timeline-item>
            </el-timeline>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="orderSendDetailClose">关闭</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="Order" lang="ts">
import { listOrder, getOrder, orderShipping, orderDeliveryList, orderexpressDetail, orderSelfGetVerify } from '@/api/order/orderList';

const { proxy } = getCurrentInstance() as any;
const { order_status, order_shipping_type } = toRefs<any>(proxy?.useDict('order_status', 'order_shipping_type'));

const dateRange = ref<any>(['', '']);
const orderList = ref([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const queryFormRef = ref<ElFormInstance>();

const expandFn = (row: any) => {
    console.log(row)
}

// 用户列表
import { listUser } from '@/api/wxappUser/wxappUserList';
const userList = ref([]);
const getUserList = () => {
    listUser().then(res => {
        userList.value = res.rows;
    })
};
getUserList()
// 订单发货详情
const orderSendDetail = reactive({
    open: false,
    title: '订单发货详情',
    form: {} as any,
})
const orderSendDetailOpen = (row: any) => {
    orderSendDetail.open = true;
    orderexpressDetail({ id: row.id }).then(res => {
        orderSendDetail.form = res.data;
    })
}
const orderSendDetailClose = () => {
    orderSendDetail.open = false;
    orderSendDetail.form = {};
}
// 订单展开
const tableRef = ref(null);
const tableExpand = ref(false)
const toggleExpand = () => {
    tableExpand.value = !tableExpand.value
    orderList.value.map(item => {
        tableRef.value.toggleRowExpansion(item, tableExpand.value)
    })
}
// 订单发货
const orderSendRef = ref(null);
const orderSend = reactive({
    open: false,
    title: '订单发货',
    form: {
        id: undefined, // 订单ID
        company: undefined,
        companyName: undefined,
        number: undefined,
        fromValue: undefined,
        toValue: undefined,
    },
    rules: {
        company: [
            { required: true, message: '请选择快递公司', trigger: 'change' }
        ],
        number: [
            { required: true, message: '请输入快递单号', trigger: 'blur' }
        ],
        fromValue: [
            { required: true, message: '请输入出发地', trigger: 'blur' }
        ],
        toValue: [
            { required: true, message: '请输入目的地', trigger: 'blur' }
        ]
    },
});
const expressCompanyList = ref([]);
const getExpressCompanyList = () => {
    orderDeliveryList().then(res => {
        expressCompanyList.value = res.rows;
    })
}
const expressChange = (value: any) => {
    if (value) {
        for (let i of expressCompanyList.value) {
            if (i.code == value) {
                orderSend.form.companyName = i.name;
                break;
            }
        }
    }
};
// 自提核销
const orderZTHX = (row: any) => {
    ElMessageBox.prompt('请输入用户提供的自提码', '请输入', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^\S+$/,
        inputErrorMessage: '请输入自提码！',
    }).then(({ value }) => {
        orderSelfGetVerify({ selfGetCode: value }).then(() => {
            proxy?.$modal.msgSuccess("操作成功");
            getList()
        })
    }).catch(() => {
    })
    // proxy?.$modal.prompt("请输入用户提供的自提码").then(({ value }) => {
    //     if (value) {

    //     } else {
    //         proxy?.$modal.msgWarning("请输入自提码");
    //     }
    // });
}
// 自提发货
const orderSendZT = (row: any) => {
    orderSend.form.id = row.id;
    proxy?.$modal.confirm("是否确定发货").then(() => {
        orderShipping(orderSend.form).then(res => {
            proxy?.$modal.msgSuccess("操作成功");
            getList()
        }).finally(() => buttonLoading.value = false);
    });
}
const orderSendOpen = (row: any) => {
    orderSend.open = true;
    orderSend.form.id = row.id;
    orderSend.form.toValue = row.address;
    getExpressCompanyList();
    proxy?.getConfigKey('default.address').then((response) => {
        orderSend.form.fromValue = response.data;
    });
}
const orderSendClose = () => {
    orderSend.open = false;
    // 重置表单
    orderSendRef.value?.resetFields();
}
const orderSendSub = () => {
    orderSendRef.value?.validate((valid: any) => {
        if (valid) {
            buttonLoading.value = true;
            orderShipping(orderSend.form).then(res => {
                proxy?.$modal.msgSuccess("操作成功");
                orderSendClose();
                getList()
            }).finally(() => buttonLoading.value = false);
        }
    });
}

const data = reactive<any>({
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        orderNo: undefined,
        orderByColumn: 'createTime',
        isAsc: 'desc'
    }
});

const { queryParams } = toRefs(data);

/** 查询订单信息列表 */
const getList = async () => {
    loading.value = true;
    const res = await listOrder(proxy?.reconstructDateRange(queryParams.value, dateRange.value, 'createTimeBegin', 'createTimeEnd'));
    orderList.value = res.rows;
    total.value = res.total;
    loading.value = false;
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

/** 导出按钮操作 */
const handleExport = () => {
    let subData = JSON.parse(JSON.stringify(queryParams.value));
    delete subData.pageNum;
    delete subData.pageSize;
    proxy?.download('admin/order/export', {
        ...subData
    }, `订单_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
    let appUserId = sessionStorage.getItem('appUserId')
    if (appUserId) {
        queryParams.value.appUserId = appUserId;
        // 使用后立即删除
        sessionStorage.removeItem('appUserId');
        getList();
    } else {
        getList();
    }
});
</script>
