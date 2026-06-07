<template>
    <div class="p-2">
        <transition :enter-active-class="proxy?.animate.searchAnimate.enter"
            :leave-active-class="proxy?.animate.searchAnimate.leave">
            <div v-show="showSearch" class="mb-[10px]">
                <el-card shadow="hover">
                    <el-form ref="queryFormRef" :model="queryParams" :inline="true">
                        <el-form-item label="新闻标题" prop="title">
                            <el-input v-model="queryParams.title" placeholder="请输入新闻标题" clearable
                                @keyup.enter="handleQuery" />
                        </el-form-item>
                        <el-form-item label="副标题" prop="subTitle">
                            <el-input v-model="queryParams.subTitle" placeholder="请输入副标题" clearable
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
                            v-hasPermi="['forest:news:add']">新增</el-button>
                    </el-col>
                    <el-col :span="1.5">
                        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()"
                            v-hasPermi="['forest:news:edit']">修改</el-button>
                    </el-col>
                    <!-- <el-col :span="1.5">
                        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()"
                            v-hasPermi="['forest:news:remove']">删除</el-button>
                    </el-col> -->
                    <!-- <el-col :span="1.5">
                        <el-button type="warning" plain icon="Download" @click="handleExport"
                            v-hasPermi="['forest:news:export']">导出</el-button>
                    </el-col> -->
                    <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
                </el-row>
            </template>

            <el-table v-loading="loading" border :data="newsList" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="新闻标题" align="center" prop="title" />
                <el-table-column label="新闻副标题" align="center" prop="subTitle" />
                <!-- <el-table-column label="时间" align="center" prop="newsTime" width="180">
                    <template #default="scope">
                        <span>{{ parseTime(scope.row.newsTime, '{y}-{m}-{d}') }}</span>
                    </template>
                </el-table-column> -->
                <!-- <el-table-column label="详情" align="center" prop="detail" />
                <el-table-column label="状态" align="center" prop="status" /> -->
                <el-table-column label="操作" align="center" fixed="right" class-name="small-padding fixed-width">
                    <template #default="scope">
                        <el-tooltip content="修改" placement="top">
                            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                                v-hasPermi="['forest:news:edit']"></el-button>
                        </el-tooltip>
                        <!-- <el-tooltip content="删除" placement="top">
                            <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                                v-hasPermi="['forest:news:remove']"></el-button>
                        </el-tooltip> -->
                    </template>
                </el-table-column>
            </el-table>

            <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-card>
        <!-- 添加或修改新闻对话框 -->
        <el-dialog :title="dialog.title" v-model="dialog.visible" width="1000" append-to-body>
            <el-form ref="newsFormRef" :model="form" :rules="rules" label-width="80px">
                <el-form-item label="新闻标题" prop="title">
                    <el-input v-model="form.title" placeholder="请输入新闻标题" />
                </el-form-item>
                <el-form-item label="副标题" prop="subTitle">
                    <el-input v-model="form.subTitle" placeholder="请输入新闻副标题" />
                </el-form-item>
                
                <!-- <el-form-item label="时间" prop="newsTime">
                    <el-date-picker clearable v-model="form.newsTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss"
                        placeholder="请选择时间">
                    </el-date-picker>
                </el-form-item> -->
                <el-form-item label="详情" prop="detail">
                    <editor v-model="form.detail" :min-height="192" />
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

<script setup name="News" lang="ts">
import { listNews, getNews, delNews, addNews, updateNews } from '@/api/news/news';
import { NewsVO, NewsQuery, NewsForm } from '@/api/news/news/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const newsList = ref<NewsVO[]>([]);
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string | number>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dateRangeNewsTime = ref<[DateModelType, DateModelType]>(['', '']);

const queryFormRef = ref<ElFormInstance>();
const newsFormRef = ref<ElFormInstance>();

const dialog = reactive<DialogOption>({
    visible: false,
    title: ''
});

const initFormData: NewsForm = {
    id: undefined,
    title: undefined,
    authorName: undefined,
    subTitle: undefined,
    newsTime: undefined,
    detail: undefined,
    status: undefined,
}
const data = reactive<PageData<NewsForm, NewsQuery>>({
    form: { ...initFormData },
    queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: undefined,
        authorName: undefined,
        subTitle: undefined,
        status: undefined,
        params: {
            newsTime: undefined,
        }
    },
    rules: {
        id: [
            { required: true, message: "id不能为空", trigger: "blur" }
        ],
        title: [
            { required: true, message: "新闻标题不能为空", trigger: "blur" }
        ],
        detail: [
            { required: true, message: "详情不能为空", trigger: "blur" }
        ],
    }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询新闻列表 */
const getList = async () => {
    loading.value = true;
    queryParams.value.params = {};
    proxy?.addDateRange(queryParams.value, dateRangeNewsTime.value, 'NewsTime');
    const res = await listNews(queryParams.value);
    newsList.value = res.rows;
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
    newsFormRef.value?.resetFields();
}

/** 搜索按钮操作 */
const handleQuery = () => {
    queryParams.value.pageNum = 1;
    getList();
}

/** 重置按钮操作 */
const resetQuery = () => {
    dateRangeNewsTime.value = ['', ''];
    queryFormRef.value?.resetFields();
    handleQuery();
}

/** 多选框选中数据 */
const handleSelectionChange = (selection: NewsVO[]) => {
    ids.value = selection.map(item => item.id);
    single.value = selection.length != 1;
    multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
    reset();
    dialog.visible = true;
    dialog.title = "添加新闻";
}

/** 修改按钮操作 */
const handleUpdate = async (row?: NewsVO) => {
    reset();
    const _id = row?.id || ids.value[0]
    const res = await getNews(_id);
    Object.assign(form.value, res.data);
    dialog.visible = true;
    dialog.title = "修改新闻";
}

/** 提交按钮 */
const submitForm = () => {
    newsFormRef.value?.validate(async (valid: boolean) => {
        if (valid) {
            buttonLoading.value = true;
            if (form.value.id) {
                await updateNews(form.value).finally(() => buttonLoading.value = false);
            } else {
                await addNews(form.value).finally(() => buttonLoading.value = false);
            }
            proxy?.$modal.msgSuccess("操作成功");
            dialog.visible = false;
            await getList();
        }
    });
}

/** 删除按钮操作 */
const handleDelete = async (row?: NewsVO) => {
    const _ids = row?.id || ids.value;
    await proxy?.$modal.confirm('是否确认删除新闻编号为"' + _ids + '"的数据项？').finally(() => loading.value = false);
    await delNews(_ids);
    proxy?.$modal.msgSuccess("删除成功");
    await getList();
}

/** 导出按钮操作 */
const handleExport = () => {
    proxy?.download('forest/news/export', {
        ...queryParams.value
    }, `news_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
    getList();
});
</script>
