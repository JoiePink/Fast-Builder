<template>
    <div class="p-2">
        <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
            :leave-active-class="proxy?.animate.searchAnimate.leave">
            <div v-show="showSearch" class="mb-[10px]">
                <el-card shadow="hover">
                    <el-form ref="queryFormRef" :model="queryParams" :inline="true">
                        <el-form-item label="用户昵称" prop="nickName">
                            <el-input v-model="queryParams.nickName" placeholder="请输入用户昵称" clearable
                                @keyup.enter="handleQuery" />
                        </el-form-item>
                        <el-form-item label="手机号" prop="mobile">
                            <el-input v-model="queryParams.mobile" placeholder="请输入手机号" clearable
                                @keyup.enter="handleQuery" />
                        </el-form-item>
                        <el-form-item label="状态" prop="status">
                            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
                                <el-option label="正常" :value="0" />
                                <el-option label="停用" :value="1" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="VIP等级" prop="vipLevel">
                            <el-select filterable v-model="queryParams.vipLevel" placeholder="请选择VIP等级" clearable>
                                <el-option v-for="item in vipList" :key="item.id" :label="item.name"
                                    :value="item.level" />
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
                        <el-button type="info" plain icon="Sort" @click="toggleExpand">展开/折叠</el-button>
                    </el-col>
                    <el-col :span="1.5">
                        <el-button type="warning" plain icon="Download" @click="handleExport">导出</el-button>
                    </el-col>
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
                </el-row>
            </template>

            <el-table ref="tableRef" v-loading="loading" border :data="userList">
                <el-table-column type="expand">
                    <template #default="scope">
                        <div style="padding:10px 20px;">
                            <el-descriptions :column="4" label-width="150">
                                <el-descriptions-item label="性别" width="200">
                                    <span v-if="scope.row.sex == 1">保密</span>
                                    <span v-if="scope.row.sex == 2">男</span>
                                    <span v-if="scope.row.sex == 3">女</span>
                                    <!-- <dict-tag :options="wx_app_user_sex" :value="scope.row.sex" /> -->
                                </el-descriptions-item>
                                <!-- <el-descriptions-item label="邀请码" width="200">
                                    {{ scope.row.inviteCode }}
                                </el-descriptions-item> -->
                                <el-descriptions-item label="邀请人" width="200">
                                    {{ scope.row.parentUserName || '无' }}
                                </el-descriptions-item>
                                <el-descriptions-item label="vip等级/折扣率" width="200">
                                    <span v-if="scope.row.isVip">{{ scope.row.vipName }}<{{ scope.row.vipDiscountValue *
                                        1 }}%></span>
                                    <span v-else>非VIP</span>
                                </el-descriptions-item>
                                <el-descriptions-item label="历史余额总额" width="200">
                                    {{ scope.row.totalPrice }}
                                </el-descriptions-item>
                                <el-descriptions-item label="历史积分总额" width="200">
                                    {{ scope.row.totalBalance }}
                                </el-descriptions-item>
                                <el-descriptions-item label="创建时间" width="200">
                                    {{ scope.row.createTime }}
                                </el-descriptions-item>
                            </el-descriptions>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="用户头像" align="center" prop="avatarUrl">
                    <template #default="scope">
                        <image-preview :src="scope.row.avatarUrl" :width="50" :height="50" />
                    </template>
                </el-table-column>
                <el-table-column label="用户昵称" align="center" prop="nickName" />
                <el-table-column label="手机号" align="center" prop="mobile" />
                <el-table-column label="余额" align="center" prop="normalPrice">
                    <template #default="scope">
                        <el-tooltip content="查看日志" placement="top">
                            <el-button link type="primary" icon="Notebook" @click="accountLogOpen(scope.row, 2)">
                                {{ scope.row.normalPrice }}
                            </el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column label="积分" align="center" prop="normalBalance">
                    <template #default="scope">
                        <el-tooltip content="查看日志" placement="top">
                            <el-button link type="primary" icon="Notebook" @click="accountLogOpen(scope.row, 1)">
                                {{ scope.row.normalBalance }}
                            </el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column label="下级用户" align="center" prop="normalBalance">
                    <template #default="scope">
                        <el-tooltip content="查看下级用户" placement="top">
                            <el-button link type="primary" icon="User" @click="inviteListOpen(scope.row)">
                                一级:{{ scope.row.childrenCount }}
                                二级:{{ scope.row.nextChildrenCount }}
                            </el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <!-- <el-table-column label="提现总额" align="center" prop="normalPrice">
                    <template #default="scope">
                        <el-tooltip content="查看日志" placement="top">
                            <el-button link type="primary" icon="Notebook" @click="accountLogOpen(scope.row, 2)">
                                {{ scope.row.normalPrice }}
                            </el-button>
                        </el-tooltip>
                    </template>
                </el-table-column> -->
                <el-table-column label="消费总额" align="center" prop="totalAmount">
                    <template #default="scope">
                        <el-tooltip content="查看订单" placement="top">
                            <el-button link type="primary" icon="Notebook" @click="linkToOrder(scope.row)">
                                {{ scope.row.totalAmount }}
                            </el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <!-- <el-table-column label="vip等级" align="center" prop="vipName" /> -->
                <el-table-column label="账号状态" align="center" prop="status">
                    <template #default="scope">
                        <el-switch v-model="scope.row.status" size="large"
                            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" inline-prompt
                            active-value="0" active-text="正常" inactive-value="1" inactive-text="停用"
                            @change="handleStatusChange(scope.row)" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center" fixed="right" class-name="small-padding fixed-width">
                    <template #default="scope">
                        <el-tooltip content="提现记录" placement="top">
                            <el-button link type="primary" icon="CreditCard"
                                @click="cashLogOpen(scope.row)"></el-button>
                        </el-tooltip>
                        <el-tooltip content="修改" placement="top">
                            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                                v-hasPermi="['forest:user:update']"></el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>
            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-card>

        <!-- 添加或修改app用户信息对话框 -->
        <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
            <el-form ref="userFormRef" :model="form" :rules="rules" label-width="80px">
                <el-form-item label="用户昵称" prop="nickName">
                    <el-input v-model="form.nickName" placeholder="请输入用户昵称" />
                </el-form-item>
                <el-form-item label="用户头像" prop="avatar">
                    <image-upload v-model="form.avatar" :limit="1" />
                </el-form-item>
                <!-- <el-form-item label="手机号" prop="mobile">
                    <el-input disabled v-model="form.mobile" placeholder="请输入手机号" />
                </el-form-item> -->
                <el-form-item label="性别" prop="sex">
                    <el-select v-model="form.sex" placeholder="请选择性别">
                        <el-option v-for="dict in wx_app_user_sex" :key="dict.value" :label="dict.label"
                            :value="dict.value * 1" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
                    <el-button @click="cancel">取 消</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 账户日志 -->
        <el-dialog :title="accountLog.title" v-model="accountLog.open" width="1000" append-to-body>
            <el-table v-loading="loading" :data="accountLog.list">
                <el-table-column align="center" label="类型" width="100">
                    <template #default="scope">
                        <el-tag>{{ scope.row.valueType == 1 ? '积分' : '余额' }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column align="center" width="100">
                    <template #header>
                        <span style="color: #67c23a;">增</span> / <span style="color: #f56c6c;">减</span>
                    </template>
                    <template #default="scope">
                        <el-tag :type="scope.row.editType == 1 ? 'success' : 'danger'">
                            {{ scope.row.value * 1 }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column align="center" show-overflow-tooltip label="变更类型" prop="detail">
                    <!-- <template #default="scope">
                        <dict-tag :options="user_account_log_about_key" :value="scope.row.aboutKey" />
                    </template> -->
                </el-table-column>
                <el-table-column align="center" label="时间" prop="createTime" width="200">
                    <!-- <template #default="scope">
                        <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
                    </template> -->
                </el-table-column>
            </el-table>
            <pagination v-show="accountLog.total > 0" :total="accountLog.total" v-model:page="accountLog.query.pageNum"
                v-model:limit="accountLog.query.pageSize" @pagination="getUserAccountLog" />
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="accountLogClose">取 消</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 提现日志 -->
        <el-dialog :title="cashLog.title" v-model="cashLog.open" width="800" append-to-body>
            <el-table v-loading="loading" :data="cashLog.list">
                <el-table-column align="center" label="信息类型" prop="infoType">
                </el-table-column>
                <el-table-column align="center" label="提现状态">
                    <template #default="scope">
                        <dict-tag :options="user_cash_status" :value="scope.row.status" />
                    </template>
                </el-table-column>
                <el-table-column align="center" label="提现金额" prop="transferAmount">
                    <template #default="scope">
                        <el-tag>{{ parseFloat((scope.row.transferAmount / 100).toFixed(2)) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column align="center" label="提现用户" prop="realName">
                </el-table-column>
                <el-table-column align="center" label="时间" prop="createTime">
                    <template #default="scope">
                        <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
                    </template>
                </el-table-column>
            </el-table>
            <pagination v-show="cashLog.total > 0" :total="cashLog.total" v-model:page="cashLog.query.pageNum"
                v-model:limit="cashLog.query.pageSize" @pagination="getCashLog" />
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="cashLogClose">取 消</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 邀请记录 -->
        <el-dialog :title="inviteList.title" v-model="inviteList.open" width="800" append-to-body>
            <el-table v-loading="loading" :data="inviteList.list" row-key="id">
                <el-table-column label="用户昵称" prop="nickName">
                    <template #default="scope">
                        <el-tag v-if="scope.row.level">{{ scope.row.nickName }}</el-tag>
                        <el-tag v-else type="success">{{ scope.row.nickName }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column align="center" label="用户手机号" prop="mobile">
                </el-table-column>
                <el-table-column align="center" label="消费总额" prop="totalAmount">
                </el-table-column>
            </el-table>
            <pagination v-show="inviteList.total > 0" :total="inviteList.total" v-model:page="inviteList.query.pageNum"
                v-model:limit="inviteList.query.pageSize" @pagination="getInviteList" />
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="inviteListClose">取 消</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="User" lang="ts">
import { listUser, getUser, delUser, addUser, updateUser, userChangeStatus, userAccountLog, userWithdraw, inviteUserList } from '@/api/wxappUser/wxappUserList';
import { UserVO, UserQuery, UserForm } from '@/api/wxappUser/wxappUserList/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wx_app_user_sex, user_account_log_about_key, user_cash_status } = toRefs<any>(proxy?.useDict('wx_app_user_sex', 'user_account_log_about_key', 'user_cash_status'));
const userList = ref<UserVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const userFormRef = ref<ElFormInstance>();

// 跳转订单列表order/orderList页面
import { useRouter } from 'vue-router'
const router = useRouter()
const linkToOrder = (row: any) => {
    sessionStorage.setItem('appUserId', String(row.id))
    router.push({
        path: '/order/orderList',
    });

}

// vip等级
import { listVip } from '@/api/wxappUser/wxappUserLevel';
const vipList = ref([]);
listVip().then(res => {
    vipList.value = res.rows;
});

// 展开
const tableRef = ref(null);
const tableExpand = ref(false)
const toggleExpand = () => {
    tableExpand.value = !tableExpand.value
    userList.value.map(item => {
        tableRef.value.toggleRowExpansion(item, tableExpand.value)
    })
}

const inviteList = reactive({
    open: false,
    title: '邀请记录',
    list: [] as any,
    query: {
        pageNum: 1,
        pageSize: 10,
        orderByColumn: 'createTime',
        isAsc: 'desc',
        parentInviteCode: undefined
    },
    total: 0
});
const inviteListOpen = (row: any) => {
    inviteList.query.parentInviteCode = row.inviteCode;
    getInviteList();
};
const getInviteList = () => {
    inviteUserList(inviteList.query).then(res => {
        for (let i of res.rows) {
            i.level = 1;
        };
        inviteList.list = res.rows;
        inviteList.total = res.total;
        inviteList.open = true;
    })
};
const inviteListClose = () => {
    inviteList.open = false;
    inviteList.query.pageNum = 1;
    inviteList.list = [];
};

const cashLog = reactive({
    open: false,
    title: '提现记录',
    list: [] as any,
    query: {
        pageNum: 1,
        pageSize: 10,
        userId: undefined,
        status: undefined
    },
    total: 0
})
const cashLogOpen = (row: any) => {
    // cashLog.open = true;
    cashLog.query.userId = row.id;
    getCashLog();
};
const getCashLog = () => {
    userWithdraw(cashLog.query).then(res => {
        cashLog.list = res.rows;
        cashLog.total = res.total;
        cashLog.open = true;
    })
};
const cashLogClose = () => {
    cashLog.open = false;
    cashLog.query.pageNum = 1;
}

const accountLog = reactive({
    open: false,
    title: '会员账户日志',
    list: [] as any,
    query: {
        pageNum: 1,
        pageSize: 10,
        userId: undefined,
        valueType: undefined,
        orderByColumn: 'createTime',
        isAsc: 'desc'
    },
    total: 0
})
const accountLogOpen = (row: any, valueType: any) => {
    accountLog.query.userId = row.id;
    accountLog.query.valueType = valueType;
    getUserAccountLog();
};
const getUserAccountLog = () => {
    userAccountLog(accountLog.query).then((res) => {
        accountLog.list = res.rows;
        accountLog.total = res.total;
        accountLog.open = true;
    })
};
const accountLogClose = () => {
    accountLog.open = false;
    accountLog.query.pageNum = 1;
};

const dialog = reactive<DialogOption>({
    visible: false,
    title: ''
});

const initFormData: UserForm = {
    id: undefined,
    account: undefined,
    nickName: undefined,
    avatar: undefined,
    password: undefined,
    mobile: undefined,
    email: undefined,
    saltValue: undefined,
    openId: undefined,
    openIdx: undefined,
    status: undefined,
    totalAmount: undefined,
    sex: undefined,
    unionId: undefined,
    inviteCode: undefined,
    parentInviteCode: undefined,
    inviteQrCode: undefined
}
const data = reactive<any>({
    form: { ...initFormData },
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        account: undefined,
        nickName: undefined,
        avatar: undefined,
        password: undefined,
        mobile: undefined,
        email: undefined,
        saltValue: undefined,
        openId: undefined,
        openIdx: undefined,
        status: undefined,
        totalAmount: undefined,
        sex: undefined,
        unionId: undefined,
        inviteCode: undefined,
        parentInviteCode: undefined,
        inviteQrCode: undefined,
        params: {
        }
    },
    rules: {
        id: [
            { required: true, message: "用户ID不能为空", trigger: "blur" }
        ],
        nickName: [
            { required: true, message: "用户昵称不能为空", trigger: "blur" }
        ],
    }
});

const { queryParams, form, rules } = toRefs(data);

const handleStatusChange = (row: any) => {
    userChangeStatus({
        id: row.id,
    }).then(() => {
        proxy?.$modal.msgSuccess("操作成功");

    })
}

/** 查询app用户信息列表 */
const getList = async () => {
    loading.value = true;
    const res = await listUser(queryParams.value);
    userList.value = res.rows;
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
    userFormRef.value?.resetFields();
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

/** 修改按钮操作 */
const handleUpdate = async (row?: UserVO) => {
    reset();
    const _id = row?.id || ids.value[0]
    const res = await getUser(_id);
    Object.assign(form.value, res.data);
    dialog.visible = true;
    dialog.title = "修改用户信息";
}

/** 提交按钮 */
const submitForm = () => {
    userFormRef.value?.validate(async (valid: boolean) => {
        if (valid) {
            buttonLoading.value = true;
            if (form.value.id) {
                await updateUser(form.value).finally(() => buttonLoading.value = false);
            } else {
                await addUser(form.value).finally(() => buttonLoading.value = false);
            }
            proxy?.$modal.msgSuccess("操作成功");
            dialog.visible = false;
            await getList();
        }
    });
}


/** 导出按钮操作 */
const handleExport = () => {
    let subData = JSON.parse(JSON.stringify(queryParams.value));
    delete subData.pageNum;
    delete subData.pageSize;
    proxy?.download('api/admin/user/export', {
        ...subData
    }, `用户_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
    getList();
});
</script>
