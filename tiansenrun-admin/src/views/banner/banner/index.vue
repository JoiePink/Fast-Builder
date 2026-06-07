<template>
    <div class="p-2">
        <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
            :leave-active-class="proxy?.animate.searchAnimate.leave">
            <div v-show="showSearch" class="mb-[10px]">
                <el-card shadow="hover">
                    <el-form ref="queryFormRef" :model="queryParams" :inline="true">
                        <el-form-item label="广告类型" prop="type">
                            <el-select v-model="queryParams.type" placeholder="请选择广告类型" clearable>
                                <el-option v-for="dict in add_type" :key="dict.value" :label="dict.label"
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
                            v-hasPermi="['forest:banner:add']">新增</el-button>
                    </el-col>
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
                </el-row>
            </template>
            <el-table v-loading="loading" border :data="bannerList">
                <el-table-column label="广告类型" align="center" prop="type">
                    <template #default="scope">
                        <dict-tag :options="add_type" :value="scope.row.type" />
                    </template>
                </el-table-column>
                <el-table-column label="广告图片" align="center" prop="imageLinkUrl">
                    <template #default="scope">
                        <image-preview :src="scope.row.imageLinkUrl" :width="50" :height="50" />
                    </template>
                </el-table-column>
                <el-table-column label="排序" align="center" prop="orders" />
                <el-table-column label="跳转链接" align="center" prop="jumpLink" />
                <el-table-column label="操作" align="center" fixed="right" class-name="small-padding fixed-width">
                    <template #default="scope">
                        <el-tooltip content="修改" placement="top">
                            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                                v-hasPermi="['forest:banner:edit']"></el-button>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                                v-hasPermi="['forest:banner:remove']"></el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>
            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-card>
        <!-- 添加或修改轮播图信息对话框 -->
        <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
            <el-form ref="bannerFormRef" :model="form" :rules="rules" label-width="80px">
                <el-form-item label="广告类型" prop="type">
                    <el-select v-model="form.type" placeholder="请选择">
                        <el-option v-for="dict in add_type" :key="dict.value" :label="dict.label"
                            :value="dict.value"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="排序" prop="orders">
                    <el-input-number :min="0" :precision="0" :controls="false" class="inputLeft" v-model="form.orders"
                        placeholder="请输入排序" />
                </el-form-item>
                <el-form-item label="跳转类型" prop="jumpType">
                    <el-select v-model="form.jumpType" @change="jumpTypeChange" placeholder="请选择">
                        <el-option label="商品" value="goods"></el-option>
                        <el-option label="文章" value="news"></el-option>
                        <el-option label="其他" value="other"></el-option>
                    </el-select>
                </el-form-item>
                <template v-if="form.jumpType === 'goods'">
                    <el-form-item label="选择商品">
                        <el-select v-model="form.goods" @change="goodsChange" placeholder="请选择">
                            <el-option v-for="dict in goodsList" :key="dict.id" :label="dict.productName"
                                :value="dict.id"></el-option>
                        </el-select>
                    </el-form-item>
                </template>
                <template v-if="form.jumpType === 'news'">
                    <el-form-item label="选择文章">
                        <el-select v-model="form.news" @change="newsChange" placeholder="请选择">
                            <el-option v-for="dict in newsList" :key="dict.id" :label="dict.title"
                                :value="dict.id"></el-option>
                        </el-select>
                    </el-form-item>
                </template>
                <el-form-item label="跳转链接" prop="jumpLink">
                    <el-input v-model="form.jumpLink" placeholder="请输入跳转链接" />
                </el-form-item>
                <el-form-item label="广告图片" prop="imageLink">
                    <image-upload :isShowTip="false" v-model="form.imageLink" :limit="1" />
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

<script setup name="Banner" lang="ts">
import { listBanner, getBanner, delBanner, addBanner, updateBanner } from '@/api/banner/banner';
import { BannerVO } from '@/api/banner/banner/types';
import { listProduct } from '@/api/goods/goods';
import { listNews } from '@/api/news/news';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { add_type } = toRefs<any>(proxy?.useDict('add_type'));

const bannerList = ref<any>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<any>();
const bannerFormRef = ref<any>();

const dialog = reactive<any>({
    visible: false,
    title: ''
});

const initFormData: any = {
    id: undefined,
    imageLink: undefined,
    orders: undefined,
    status: 0,
    jumpLink: undefined,
    type: undefined,
    goods: undefined,
    news: undefined,
}
const data = reactive<any>({
    form: { ...initFormData },
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        imageLink: undefined,
        orders: undefined,
        status: undefined,
        jumpLink: undefined,
        type: undefined,
        orderByColumn: 'orders',
        isAsc: 'asc'
    },
    rules: {
        imageLink: [
            { required: true, message: "广告图片不能为空", trigger: "blur" }
        ],
        type: [
            { required: true, message: "广告类型不能为空", trigger: "change" }
        ],
        status: [
            { required: true, message: "状态不能为空", trigger: "change" }
        ],
    }
});

const { queryParams, form, rules } = toRefs(data);

const jumpTypeChange = (value: any) => {
    form.value.goods = undefined;
    form.value.jumpLink = undefined;
}
const goodsList = ref([]);
listProduct().then(res => {
    goodsList.value = res.rows;
});
const newsList = ref([]);
listNews().then(res => {
    newsList.value = res.rows;
});
const goodsChange = (value: any) => {
    form.value.jumpLink = `/pages/goods/detail?id=${value}`;
}
const newsChange = (value: any) => {
    form.value.jumpLink = `/pages/news/index?id=${value}`;
}

/** 查询轮播图信息列表 */
const getList = async () => {
    loading.value = true;
    const res = await listBanner(queryParams.value);
    bannerList.value = res.rows;
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
    bannerFormRef.value?.resetFields();
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
    dialog.title = "添加轮播图信息";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: any) => {
    reset();
    const res = await getBanner(row.id);
    Object.assign(form.value, res.data);
    dialog.visible = true;
    dialog.title = "修改轮播图信息";
}

/** 提交按钮 */
const submitForm = () => {
    bannerFormRef.value?.validate(async (valid: boolean) => {
        if (valid) {
            buttonLoading.value = true;
            if (form.value.id) {
                await updateBanner(form.value).finally(() => buttonLoading.value = false);
            } else {
                await addBanner(form.value).finally(() => buttonLoading.value = false);
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
    await proxy?.$modal.confirm('是否确认删除轮播图？').finally(() => loading.value = false);
    await delBanner(_ids);
    proxy?.$modal.msgSuccess("删除成功");
    await getList();
}

onMounted(() => {
    getList();
});
</script>
