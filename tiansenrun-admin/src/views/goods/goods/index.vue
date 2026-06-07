<template>
    <div class="p-2">
        <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
            :leave-active-class="proxy?.animate.searchAnimate.leave">
            <div v-show="showSearch" class="mb-[10px]">
                <el-card shadow="hover">
                    <el-form ref="queryFormRef" :model="queryParams" :inline="true">
                        <el-form-item label="商品分类" prop="productTypeId">
                            <el-select filterable v-model="queryParams.productTypeId" placeholder="请选择商品分类" clearable>
                                <el-option v-for="item in productTypeList" :key="item.id"
                                    :label="`${item.productTypeName}${item.balanceFlag == 1 ? '（ 积分商品 ）' : ''}`"
                                    :value="item.id" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="商品名称" prop="keyword">
                            <el-input v-model="queryParams.keyword" placeholder="请输入商品名称" clearable
                                @keyup.enter="handleQuery" />
                        </el-form-item>
                        <el-form-item label="推荐" prop="recommend">
                            <el-select v-model="queryParams.recommend" placeholder="请选择是否推荐" clearable>
                                <el-option v-for="dict in goods_recommend" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="新品" prop="isNew">
                            <el-select v-model="queryParams.isNew" placeholder="请选择是否新品" clearable>
                                <el-option v-for="dict in goods_is_new" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="热门" prop="isHot">
                            <el-select v-model="queryParams.isHot" placeholder="请选择是否热门" clearable>
                                <el-option v-for="dict in goods_is_hot" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="状态" prop="status">
                            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
                                <el-option v-for="dict in goods_status" :key="dict.value" :label="dict.label"
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
                            v-hasPermi="['forest:product:add']">新增</el-button>
                    </el-col>
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
                </el-row>
            </template>

            <el-table v-loading="loading" border :data="productList">
                <el-table-column label="商品名称" align="center" prop="productName" />
                <el-table-column label="商品主图" align="center" prop="imageUrl">
                    <template #default="scope">
                        <image-preview :src="scope.row.imageUrl" :width="50" :height="50" />
                    </template>
                </el-table-column>
                <el-table-column label="商品分类" align="center" prop="productTypeName" />
                <el-table-column label="总销量" align="center" prop="saleCount" />
                <el-table-column label="推荐/新品/热门/状态" align="center">
                    <template #default="scope">
                        <div style=" display: flex; justify-content: center;">
                            <dict-tag :options="goods_recommend" :value="scope.row.recommend" />
                            <dict-tag :options="goods_is_new" :value="scope.row.isNew" />
                            <dict-tag :options="goods_is_hot" :value="scope.row.isHot" />
                            <dict-tag :options="goods_status" :value="scope.row.status" />
                        </div>
                    </template>
                </el-table-column>
                <!-- <el-table-column label="收藏人数" align="center" prop="collectCount" /> -->
                <el-table-column label="总库存/锁定库存" align="center">
                    <template #default="scope">
                        <div style=" display: flex; justify-content: center;">
                            <el-tag type="primary">{{ scope.row.totalStock }}</el-tag>
                            <el-tag type="info">
                                <el-icon>
                                    <Lock />
                                </el-icon>
                                {{ scope.row.lockStock }}
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center" fixed="right" class-name="small-padding fixed-width">
                    <template #default="scope">
                        <el-tooltip content="修改" placement="top">
                            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                                v-hasPermi="['forest:product:edit']"></el-button>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                                v-hasPermi="['forest:product:remove']"></el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>

            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-card>

        <!-- 添加或修改商品基本信息对话框 -->
        <el-dialog :title="dialog.title" @close="cancel" v-model="dialog.visible" width="1300" append-to-body
            destroy-on-close>
            <el-form ref="productFormRef" :model="form" :rules="rules" label-width="100">
                <el-row :gutter="10">
                    <el-col :span="8">
                        <el-form-item label="商品分类" prop="productTypeId">
                            <el-select filterable v-model="form.productTypeId" @change="productTypeChange"
                                placeholder="请选择商品分类" clearable>
                                <el-option v-for="item in productTypeList" :key="item.id" :label="item.productTypeName"
                                    :value="item.id" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="商品名称" prop="productName">
                            <el-input v-model="form.productName" placeholder="请输入商品名称" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="总销量" prop="saleCount">
                            <el-input-number :min="0" :precision="0" :controls="false" class="inputLeft"
                                v-model="form.saleCount" placeholder="请输入总销量" />
                        </el-form-item>
                    </el-col>
                    <!-- <el-col :span="8">
                        <el-form-item label="商品类型" prop="balanceFlag">
                            <el-segmented disabled v-model="form.balanceFlag" :options="goods_type">
                            </el-segmented>
                        </el-form-item>
                    </el-col> -->
                    <el-col :span="8">
                        <el-form-item label="状态" prop="status">
                            <el-radio-group v-model="form.status">
                                <el-radio-button v-for="dict in goods_status" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="是否推荐" prop="recommend">
                            <el-radio-group v-model="form.recommend">
                                <el-radio-button v-for="dict in goods_recommend" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="是否新品" prop="isNew">
                            <el-radio-group v-model="form.isNew">
                                <el-radio-button v-for="dict in goods_is_new" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="是否热门" prop="isHot">
                            <el-radio-group v-model="form.isHot">
                                <el-radio-button v-for="dict in goods_is_hot" :key="dict.value" :label="dict.label"
                                    :value="dict.value" />
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <el-form-item label="商品规格" prop="skus">
                            <el-button type="primary" icon="Plus" @click="formSkuAdd">新增</el-button>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <el-form-item>
                            <el-table border :data="form.skus" preserve-expanded-content default-expand-all>
                                <el-table-column type="expand">
                                    <template #default="scope">
                                        <el-table :data="scope.row.rewards">
                                            <el-table-column align="center" label="排序" prop="orders" />
                                            <el-table-column label="返利数额" prop="rewardValue">
                                                <template #default="scopeRow">
                                                    <el-input-number :min="0" :controls="false" class="inputLeft"
                                                        v-model="scopeRow.row.rewardValue" placeholder="请输入返利数额">
                                                        <template #suffix>
                                                            <span>元</span>
                                                        </template>
                                                    </el-input-number>
                                                </template>
                                            </el-table-column>
                                            <el-table-column label="签到天数" prop="needContinuousSignDay">
                                                <template #default="scopeRow">
                                                    <el-input-number :min="0" :controls="false" class="inputLeft"
                                                        v-model="scopeRow.row.needContinuousSignDay"
                                                        placeholder="请输入签到天数">
                                                        <template #suffix>
                                                            <span>天</span>
                                                        </template>
                                                    </el-input-number>
                                                </template>
                                            </el-table-column>
                                            <el-table-column label="操作" width="180">
                                                <template #default="scopeRow">
                                                    <el-button type="danger" icon="Delete" link
                                                        @click="formSkuRewardsDelete(scope.row.rewards, scopeRow.$index)">删除</el-button>
                                                </template>
                                            </el-table-column>
                                        </el-table>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="skuName" label="名称">
                                    <template #default="scope">
                                        <el-input v-model="scope.row.skuName" placeholder="请输入名称" />
                                    </template>
                                </el-table-column>
                                <el-table-column prop="price" label="价格">
                                    <template #default="scope">
                                        <el-input-number :min="0" :controls="false" class="inputLeft"
                                            v-model="scope.row.price" @change="calculateRewardBalance(scope.row)"
                                            placeholder="请输入价格" />
                                    </template>
                                </el-table-column>
                                <el-table-column prop="rewardBalance">
                                    <template #header>
                                        <span style="color: #67c23a;">购买返利积分</span>
                                    </template>
                                    <template #default="scope">
                                        <el-input-number :min="0" :precision="0" :controls="false" class="inputLeft"
                                            v-model="scope.row.rewardBalance"
                                            :placeholder="`默认为价格的${rewardRatio * 100}%,取整`" />
                                    </template>
                                </el-table-column>
                                <el-table-column prop="totalStock" label="库存">
                                    <template #default="scope">
                                        <el-input-number :min="0" :precision="0" :controls="false" class="inputLeft"
                                            v-model="scope.row.totalStock" placeholder="请输入库存" />
                                    </template>
                                </el-table-column>
                                <el-table-column prop="freightAmount" label="运费">
                                    <template #default="scope">
                                        <el-input-number :min="0" :controls="false" class="inputLeft"
                                            v-model="scope.row.freightAmount" placeholder="请输入运费" />
                                    </template>
                                </el-table-column>
                                <el-table-column prop="distributionRewardOne" label="一级返利">
                                    <template #header>
                                        <div style="display: flex; align-items: center;">
                                            <el-tooltip
                                                content="数值大于0则该商品使用设置的值作为返利比例，等于0或者为空则使用全局返利比例。全局返利比例设置：[系统管理>参数设置>一级分销默认返利比例]"
                                                placement="top">
                                                <el-icon><question-filled /></el-icon>
                                            </el-tooltip>
                                            &nbsp;一级返利
                                        </div>
                                    </template>
                                    <template #default="scope">
                                        <el-input-number :min="0" :controls="false" class="inputLeft"
                                            v-model="scope.row.distributionRewardOne" placeholder="请输入">
                                            <template #suffix>
                                                <span>%</span>
                                            </template>
                                        </el-input-number>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="distributionRewardTwo" label="二级返利">
                                    <template #header>
                                        <div style="display: flex; align-items: center;">
                                            <el-tooltip
                                                content="数值大于0则该商品使用设置的值作为返利比例，等于0或者为空则使用全局返利比例。全局返利比例设置：[系统管理>参数设置>二级分销默认返利比例]"
                                                placement="top">
                                                <el-icon><question-filled /></el-icon>
                                            </el-tooltip>
                                            &nbsp;二级返利
                                        </div>
                                    </template>
                                    <template #default="scope">
                                        <el-input-number :min="0" :controls="false" class="inputLeft"
                                            v-model="scope.row.distributionRewardTwo" placeholder="请输入">
                                            <template #suffix>
                                                <span>%</span>
                                            </template>
                                        </el-input-number>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="totalStock" label="操作" width="180">
                                    <template #default="scope">
                                        <el-button type="primary" icon="Plus" link
                                            @click="formSkuRewardsAdd(scope.row)">新增奖励</el-button>
                                        <el-button type="danger" icon="Delete" link
                                            @click="formSkuDelete(scope.$index)">删除</el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <el-form-item label="商品详情">
                            <editor v-model="form.detail" :min-height="192" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="商品主图" prop="image">
                            <image-upload v-model="form.image" :limit="1" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="商品轮播图" prop="banners">
                            <image-upload v-model="form.banners" />
                        </el-form-item>
                    </el-col>
                </el-row>
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

<script setup name="Product" lang="ts">
import { listProduct, getProduct, delProduct, addProduct, updateProduct } from '@/api/goods/goods';
import { listProductType } from '@/api/goods/category';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { goods_recommend, goods_status, goods_is_new, goods_is_hot, goods_type } = toRefs<any>(proxy?.useDict('goods_recommend', 'goods_status', 'goods_is_new', 'goods_is_hot', 'goods_type'));

const productList = ref<any>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<any>([]);
const total = ref(0);
const productTypeList = ref([])
const queryFormRef = ref<any>();
const productFormRef = ref<any>();

const dialog = reactive<any>({
    visible: false,
    title: ''
});

const initFormData: any = {
    id: undefined,
    productTypeId: undefined,
    productName: undefined,
    collectCount: undefined,
    saleCount: undefined,
    recommend: "0",
    status: "0",
    isNew: "0",
    isHot: "0",
    skus: [],
    balanceFlag: 0
}
const data = reactive<any>({
    form: { ...initFormData },
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        productTypeId: undefined,
        keyword: undefined,
        status: undefined,
        collectCount: undefined,
        saleCount: undefined,
        recommend: undefined,
        orders: undefined,
    },
    rules: {
        productTypeId: [{ required: true, message: "商品分类不能为空", trigger: "blur" }],
        productName: [{ required: true, message: "商品名称不能为空", trigger: "blur" }],
        skus: [
            {
                required: true,
                validator: (rule, value, callback) => {
                    if (!value || value.length === 0) {
                        callback(new Error('至少需要添加一个规格'));
                    } else {
                        callback();
                    }
                },
                trigger: 'change'
            }
        ],
        image: [{ required: true, message: "商品主图不能为空", trigger: "change" }],
        banners: [{ required: true, message: "至少上传一张轮播图", trigger: "change" }]
    }
});

const { queryParams, form, rules } = toRefs(data);

const productTypeChange = () => {
    for (let i of productTypeList.value) {
        if (form.value.productTypeId == i.id) {
            form.value.balanceFlag = i.balanceFlag + '';
            break;
        }
    }
}

// 获取积分奖励比例
const rewardRatio = ref(0);
proxy?.getConfigKey('default.reward.balance').then((response) => {
    rewardRatio.value = Number(response.data);
});
// 新增规格
const formSkuAdd = () => {
    form.value.skus.push({
        skuName: undefined,
        price: undefined,
        rewardBalance: undefined,
        totalStock: undefined,
        freightAmount: undefined,
    })
    productFormRef.value?.clearValidate('skus');
};
// 删除规格
const formSkuDelete = (index) => {
    form.value.skus.splice(index, 1);
}
// 新增商品规格奖励
const formSkuRewardsAdd = (skus) => {
    skus.rewards = skus.rewards || [];
    let orders = skus.rewards.length + 1;
    skus.rewards.push({
        orders: orders,
        rewardValue: undefined,
        needContinuousSignDay: undefined,
    });
};
// 删除商品规格奖励
const formSkuRewardsDelete = (rewards, index) => {
    rewards.splice(index, 1);
    resetRewardsOrders(rewards)
}
// 重置奖励排序
const resetRewardsOrders = (rewards) => {
    rewards.forEach((item, index) => {
        item.orders = index + 1;
    })
};
// 计算商品规格奖励积分
const calculateRewardBalance = (skus) => {
    skus.rewardBalance = Math.floor(skus.price * rewardRatio.value);
}

/** 查询商品基本信息列表 */
const getList = async () => {
    loading.value = true;
    const res = await listProduct(queryParams.value);
    productList.value = res.rows;
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
    form.value.skus = [];
    productFormRef.value?.resetFields();
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
    dialog.title = "添加商品基本信息";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: any) => {
    reset();
    const _id = row?.id || ids.value[0]
    const res = await getProduct(_id);
    res.data.isHot = res.data.isHot + '';
    res.data.isNew = res.data.isNew + '';
    res.data.status = res.data.status + '';
    res.data.recommend = res.data.recommend + '';
    res.data.balanceFlag = res.data.balanceFlag + '';
    Object.assign(form.value, res.data);
    dialog.visible = true;
    dialog.title = "修改商品基本信息";
}

/** 提交按钮 */
const submitForm = () => {
    productFormRef.value?.validate(async (valid: any) => {
        if (valid) {
            buttonLoading.value = true;
            if (form.value.balanceFlag == 1) {
                for (let i of form.value.skus) {
                    i.rewardBalance = 0;
                }
            }
            if (form.value.id) {
                await updateProduct(form.value).finally(() => buttonLoading.value = false);
            } else {
                await addProduct(form.value).finally(() => buttonLoading.value = false);
            }
            proxy?.$modal.msgSuccess("操作成功");
            dialog.visible = false;
            await getList();
        }
    });
}

/** 删除按钮操作 */
const handleDelete = async (row?: any) => {
    const _ids = row?.id || ids.value;
    await proxy?.$modal.confirm('是否确认删除商品？').finally(() => loading.value = false);
    await delProduct(_ids);
    proxy?.$modal.msgSuccess("删除成功");
    await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
    proxy?.download('forest/product/export', {
        ...queryParams.value
    }, `product_${new Date().getTime()}.xlsx`)
}

// 获取商品分类列表
const getProductTypeList = async () => {
    const res = await listProductType({ balanceFlag: 0 });
    productTypeList.value = res.rows;
};
getProductTypeList();

onMounted(() => {
    getList();
});
</script>
