var dataType, addPid, addLevel, selfPId;
var curExpandNode = null;
var setting = {
    view: {
        dblClickExpand: false,
        showLine: true,
        selectedMulti: false
    },
    data: {
        simpleData: {
            enable: true,
            idKey: "id",
            pIdKey: "pid"
        }
    },
    callback: {
        beforeExpand: beforeExpand,
        onExpand: onExpand,
        beforeClick: function(treeId, treeNode) {
            var zTree = $.fn.zTree.getZTreeObj("tree");
            $('#kname').val(treeNode.name);
            console.log(treeNode)
            $("#keypoints_group #Type").val(treeNode.importance);
            $('#details').val(treeNode.description);
            addPid = treeNode.id;
            selfPId = treeNode.pid;
            addLevel = treeNode.level;
            zTree.expandNode(treeNode,null, null, null, true);
        },
    }
};

function onExpand(event, treeId, treeNode) {
    curExpandNode = treeNode;
}
function beforeExpand(treeId, treeNode) {
    var pNode = curExpandNode ? curExpandNode.getParentNode():null;
    var treeNodeP = treeNode.parentTId ? treeNode.getParentNode():null;
    var zTree = $.fn.zTree.getZTreeObj("tree");
    for(var i=0, l=!treeNodeP ? 0:treeNodeP.children.length; i<l; i++ ) {
        if (treeNode !== treeNodeP.children[i]) {
            zTree.expandNode(treeNodeP.children[i], false);
        }
    }
    while (pNode) {
        if (pNode === treeNode) {
            break;
        }
        pNode = pNode.getParentNode();
    }
    if (!pNode) {
        singlePath(treeNode);
    }

}
function singlePath(newNode) {
    if (newNode === curExpandNode) return;

    var zTree = $.fn.zTree.getZTreeObj("tree"),
        rootNodes, tmpRoot, tmpTId, i, j, n;

    if (!curExpandNode) {
        tmpRoot = newNode;
        while (tmpRoot) {
            tmpTId = tmpRoot.tId;
            tmpRoot = tmpRoot.getParentNode();
        }
        rootNodes = zTree.getNodes();
        for (i=0, j=rootNodes.length; i<j; i++) {
            n = rootNodes[i];
            if (n.tId != tmpTId) {
                zTree.expandNode(n, false);
            }
        }
    } else if (curExpandNode && curExpandNode.open) {
        if (newNode.parentTId === curExpandNode.parentTId) {
            zTree.expandNode(curExpandNode, false);
        } else {
            var newParents = [];
            while (newNode) {
                newNode = newNode.getParentNode();
                if (newNode === curExpandNode) {
                    newParents = null;
                    break;
                } else if (newNode) {
                    newParents.push(newNode);
                }
            }
            if (newParents!=null) {
                var oldNode = curExpandNode;
                var oldParents = [];
                while (oldNode) {
                    oldNode = oldNode.getParentNode();
                    if (oldNode) {
                        oldParents.push(oldNode);
                    }
                }
                if (newParents.length>0) {
                    zTree.expandNode(oldParents[Math.abs(oldParents.length-newParents.length)-1], false);
                } else {
                    zTree.expandNode(oldParents[oldParents.length-1], false);
                }
            }
        }
    }
    curExpandNode = newNode;
}
function initTree() {
    $.ajax({
        url: conf.targetUrl+"/chapter/list",
        dataType: 'json',
        data: {},
        success: function (data) {
            var nodeData = (data.data.chapter_list);
            $.fn.zTree.init($("#tree"), setting, nodeData);
        }
    });
}
jQuery(function ($) {
    initTree();
});
//添加章节
function addData() {
    if (addPid == undefined && addLevel == undefined) {
        $('#knowledgeId').val(0);
        $('#knowledgeLevel').val(1);
    } else {
        $('#knowledgeId').val(addPid);
        $('#knowledgeLevel').val(parseInt(addLevel) + 1);
    }
    $.ajax({
        url: conf.targetUrl + '/chapter/add',
        type: 'post',
        dataType: 'json',
        data: $('#addKnowledge').serialize(),
        success: function (data) {
            if(data){
                clearForm('addKnowledge');
                $('#alertMsg').text(data.msg);

                var zTree = $.fn.zTree.getZTreeObj("tree"),
                    nodes = zTree.getSelectedNodes(),
                    treeNode = nodes[0];
                if (treeNode) {
                    zTree.addNodes(treeNode, {
                        id:data.data.chapter_info.id,
                        pId:treeNode.id,
                        importance:data.data.chapter_info.importance,
                        description:data.data.chapter_info.description,
                        isParent:false,
                        name:data.data.chapter_info.name
                    });
                } else {
                    zTree.addNodes(null, {
                        id:data.data.chapter_info.id,
                        pId:0,
                        importance:data.data.chapter_info.importance,
                        description:data.data.chapter_info.description,
                        isParent:false,
                        name:data.data.chapter_info.name
                    });
                }
            }
        }
    })
}
//修改知识
function changData() {
    var zTree = $.fn.zTree.getZTreeObj("tree"),
        nodes = zTree.getSelectedNodes(),
        treeNode = nodes[0];
    if (nodes.length == 0) {
        $('#alertMsg').text("请先选择一个节点");
        return false;
    }
    console.log(treeNode)
    $('#editPid').val(selfPId);
    $('#editId').val(addPid);
    $('#editLevel').val(addLevel);
    var dataUrl = "/chapter/update";
    var  data = $('#editForm').serializeObject();
    $.ajax({
        url: conf.targetUrl + dataUrl,
        type: 'post',
        dataType: 'json',
        data: JSON.stringify(data),
        success: function (data) {
            if(data){
                $('#alertMsg').text(data.msg);
                treeNode.importance = data.data.chapter_info.importance;
                treeNode.description = data.data.chapter_info.description;
                treeNode.name = data.data.chapter_info.name;
                $("#"+treeNode.tId+"_span").html(data.data.chapter_info.name);
            }
        }
    })
}
function deleteData() {

    var zTree = $.fn.zTree.getZTreeObj("tree"),
        nodes = zTree.getSelectedNodes(),
        treeNode = nodes[0];
    if (nodes.length == 0) {
        $('#alertMsg').text("请先选择一个节点");
        return false;
    }
    if (nodes && nodes.length>0) {
        if (treeNode.children && treeNode.children.length > 0) {
            $('#alertMsg').text("要删除的节点存在子节点，不允许删除！");
            return false;
        }}
    var dataUrl = "/chapter/del";
    $.ajax({
        url: conf.targetUrl + dataUrl,
        type: 'get',
        dataType: 'json',
        data:{id:addPid},
        success: function (data) {
            if(data){
                clearForm('editForm');
                $('#alertMsg').text(data.msg);
                zTree.removeNode(treeNode);
            }
        }
    })
}
function clearForm(dom) {
    $('#'+dom)[0].reset();
}