<template>
    <div class="p-2">
        <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
            :leave-active-class="proxy?.animate.searchAnimate.leave" @submit.native.prevent>
            <div v-show="showSearch" class="mb-[10px]">
                <el-card shadow="hover">
                    <el-form ref="queryFormRef" :model="queryParams" :inline="true">
                        <el-form-item label="分类名称" prop="productTypeName">
                            <el-input v-model="queryParams.productTypeName" placeholder="请输入商品分类名称" clearable
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
                            v-hasPermi="['forest:type:add']">新增</el-button>
                    </el-col>
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
                </el-row>
            </template>

            <el-table v-loading="loading" border :data="productTypeList">
                <el-table-column label="分类名称" align="center" prop="productTypeName" />
                <el-table-column label="分类图标" align="center" prop="productTypeIconUrl">
                    <template #default="scope">
                        <image-preview :src="scope.row.productTypeIconUrl" :width="50" :height="50" />
                    </template>
                </el-table-column>
                <el-table-column label="分类横幅" align="center" prop="productTypeImageUrl">
                    <template #default="scope">
                        <image-preview :src="scope.row.productTypeImageUrl" :width="50" :height="50" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center" fixed="right" class-name="small-padding fixed-width">
                    <template #default="scope">
                        <el-tooltip content="修改" placement="top">
                            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                                v-hasPermi="['forest:type:edit']"></el-button>
                        </el-tooltip>
                        <el-tooltip content="删除" placement="top">
                            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                                v-hasPermi="['forest:type:remove']"></el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>

            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-card>
        <!-- 添加或修改商品分类信息对话框 -->
        <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
            <el-form ref="productTypeFormRef" :model="form" :rules="rules" label-width="80px">
                <!-- <el-form-item label="上级分类" prop="parentId">
                    <el-select filterable v-model="form.parentId" placeholder="请选择上级分类,不选则为顶级分类" clearable>
                        <el-option v-for="item in productTypeList" :key="item.id" :label="item.productTypeName"
                            :value="item.id" />
                    </el-select>
                </el-form-item> -->
                <el-form-item label="分类名称" prop="productTypeName">
                    <el-input v-model="form.productTypeName" placeholder="请输入分类名称" />
                </el-form-item>
                <!-- <el-form-item label="分类类型" prop="balanceFlag">
                    <el-radio-group v-model="form.balanceFlag">
                        <el-radio-button v-for="dict in goods_type" :key="dict.value" :label="dict.label"
                            :value="dict.value*1" />
                    </el-radio-group>
                </el-form-item> -->
                <el-form-item label="分类图标" prop="productTypeIcon">
                    <image-upload v-model="form.productTypeIcon" :limit="1" />
                </el-form-item>
                <el-form-item label="分类横幅" prop="productTypeImage">
                    <image-upload v-model="form.productTypeImage" :limit="1" />
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

<script setup name="ProductType" lang="ts">
import { listProductType, getProductType, delProductType, addProductType, updateProductType } from '@/api/goods/category';
import { ProductTypeVO, ProductTypeQuery, ProductTypeForm } from '@/api/goods/category/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { goods_type } = toRefs<any>(proxy?.useDict('goods_type'));

const productTypeList = ref<ProductTypeVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const productTypeFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
    visible: false,
    title: ''
});

const initFormData: any = {
    id: undefined,
    parentId: undefined,
    productTypeName: undefined,
    productTypeIcon: undefined,
    parentStr: undefined,
    status: undefined,
    balanceFlag: 0,
    orders: undefined
}
const data = reactive<any>({
    form: { ...initFormData },
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        parentId: undefined,
        productTypeName: undefined,
        productTypeIcon: undefined,
        parentStr: undefined,
        status: undefined,
        orders: undefined,
        balanceFlag: 0,
    },
    rules: {
        balanceFlag: [
            { required: true, message: "不能为空", trigger: "change" }
        ],
        productTypeName: [
            { required: true, message: "不能为空", trigger: "blur" }
        ],
    }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询商品分类信息列表 */
const getList = async () => {
    loading.value = true;
    const res = await listProductType(queryParams.value);
    productTypeList.value = res.rows;
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
    productTypeFormRef.value?.resetFields();
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
    dialog.title = "添加商品分类信息";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: ProductTypeVO) => {
    reset();
    const _id = row?.id || ids.value[0]
    const res = await getProductType(_id);
    Object.assign(form.value, res.data);
    dialog.visible = true;
    dialog.title = "修改商品分类信息";
}

/** 提交按钮 */
const submitForm = () => {
    productTypeFormRef.value?.validate(async (valid: boolean) => {
        if (valid) {
            buttonLoading.value = true;
            if (form.value.id) {
                await updateProductType(form.value).finally(() => buttonLoading.value = false);
            } else {
                await addProductType(form.value).finally(() => buttonLoading.value = false);
            }
            proxy?.$modal.msgSuccess("操作成功");
            dialog.visible = false;
            await getList();
        }
    });
}

/** 删除按钮操作 */
const handleDelete = async (row?: ProductTypeVO) => {
    proxy?.$modal.confirm('是否确认删除商品分类信息？').then(_ => {
        delProductType(row?.id).then(res => {
            proxy?.$modal.msgSuccess("删除成功");
            getList();
        });
    }).catch(_ => {
    }).finally(() => loading.value = false);
}

onMounted(() => {
    getList();
});
</script>
