/**
 * 将扁平数据转换为树形结构
 * @param flatData 扁平数据数组
 * @returns 树形结构数组，每个节点包含 children 字段（可能为空数组）
 */
type dataNode = {
  id: number;
  parentId: number;
  publicId: string;
};


// 完全通用的从扁平化的结构构造树形结构的方法
export function buildTreeWithAnyData(
  parentKey: string,//父节点键,表示通过data上的哪个键来索引父亲
  indexKey: string,// 索引键,表示通过data上的哪个键来索引某个唯一节点
  data: any[],// 数据源
  mapper: (item: any) => any,// 将数据映射为树形结构中的节点
  isRoot: (item: any) => boolean,//判断某个节点是否是根节点
){
  const nodeMap = new Map<string, any>();
  data.forEach((item) => {
    nodeMap.set(item[indexKey], { ...mapper(item), children: [] });
  });

  const rootNodes: any[] = [];
  data.forEach((item) => {
    const node = nodeMap.get(item[indexKey]);
    if(isRoot(item)){
      rootNodes.push(node);
    }else{
      const parent = nodeMap.get(item[parentKey]);
      if(parent){
        parent.children.push(node);
      }
    }
  });
}


export function buildTree<T extends dataNode, R>(
  flatData: T[],
  mapper: (item: T) => R,
): (R & { children: (R & { children: any[] })[] })[] {
  // 创建 id 到节点的映射
  const nodeMap = new Map<number, R & { children: any[] }>();

  // 初始化所有节点并添加到映射中
  flatData.forEach((item) => {
    nodeMap.set(item.id, { ...mapper(item), children: [] });
  });

  // 构建树形结构
  const rootNodes: (R & { children: any[] })[] = [];

  flatData.forEach((item) => {
    const node = nodeMap.get(item.id)!;

    if (item.parentId === 0 || !nodeMap.has(item.parentId)) {
      // 根节点或父节点不存在，添加到根节点数组
      rootNodes.push(node);
    } else {
      // 找到父节点，将当前节点添加到父节点的 children 中
      const parent = nodeMap.get(item.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return rootNodes;
}
