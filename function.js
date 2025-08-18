//               title  padding                 if padding                 then padding
//             1.2              1.2           1             1            1             1
//     -|-----|----|----------|----|--------|---|---------|---|--------|---|---------|---|-----|
// 2.4  |2.4         1.2 titleMax     3.6         1 ifMax         3.6       1 thenMax      2.4
//     --     left margin            margin                     margin                 right margin
// 0.5  |  margin
//     --
//  1   |  if then
//     --
// 0.4  | item line margin
//     --
// 0.3  | line
//     --
// 0.5  |  margin
//     --
// 2.4  |

const setting = {
    canvasPaddingLeft: 1,
    canvasPaddingRight: 1,
    canvasPaddingTop: 2.4,
    canvasPaddingBottom: 2.4,
    titlePaddingLeft: 1.2,
    titlePaddingRight: 1.2,
    titlePaddingTop: 1.2,
    titlePaddingBottom: 1.2,
    titleFontSize: 1.2,
    titleIfMargin: 3.6,
    ifThenMargin: 2.4,
    ifPaddingLeft: 1,
    ifPaddingRight: 1,
    ifFontSize: 1,
    thenPaddingLeft: 1,
    thenPaddingRight: 1,
    thenFontSize: 1,
    itemMarginTop: 0.5,
    itemMarginBottom: 0.5,
    itemLineMargin: 0.4,
    lineWidth: 0.3,
    titleRectRadius: 0.5,
    showCanvasWidth: 400
};
const colorDefault = ['f596aa', 'fc9f4d', '0089a7', '707c74', 'ddd23b', 'c99833', '268785', '3a8fb7', '005caf', '4a225d', '6d2e5b', '855b32', '8f5a3c', 'a35e37', 'e83015', '9e7a7a', '787d7b'];

const undoList = [];
const redoList = [];
window.addEventListener('load', initializeBody);

/**
 * 變更輸入框或顏色或選單的事件，會補繪製的動作
 * @param {Event} event 
 */
function changeAndDraw(event){
    changeValue(event);
    draw();
}

/**
 * 變更輸入框或顏色或選單的事件
 * @param {Event} event 
 */
function changeValue(event){
    const dom = event.currentTarget;
    const type = dom.getAttribute('data-type');
    const oldValue = dom.getAttribute('data-value');
    if (type === 'title-text'){
        const id = dom.getAttribute('id');
        setStep(['text', type, id, oldValue]);
    }
    else if (type === 'if' || type === 'then'){
        const index = getItemIndex(dom.parentNode.parentNode);
        setStep(['text', type, index, oldValue]);
    }
    else if (type === 'item-color'){
        const index = getItemIndex(dom.parentNode.parentNode);
        setStep(['color', index, oldValue]);
    }
    else if (type === 'size-select'){
        setStep(['size', oldValue]);
    }
    else{
        const id = dom.getAttribute('id');
        setStep(['color', id, oldValue]);
    }
    dom.setAttribute('data-value', dom.value);
    checkButton();
}

/**
 * 更新功能按鈕是否 disable
 */
function checkButton(){
    const indexs = getSelectItemIndex();
    if (indexs.length > 0){
        resetButton('up', indexs[0] !== 0);
        resetButton('down', indexs[indexs.length - 1] !== getItemList().length - 1);
        resetButton('delete', true);
    }
    else{
        resetButton('up', false);
        resetButton('down', false);
        resetButton('delete', false);
    }
    resetButton('undo', undoList.length > 0);
    resetButton('redo', redoList.length > 0);

}

/**
 * 顏色下移按鈕點擊事件
 */
function clickColorDown(){
    const indexs = getSelectItemIndex();
    setStep(['move', 'color', 'down', indexs]);
    move('color', 'down');
    draw();
    checkButton();
}

/**
 * 顏色上移按鈕點擊事件
 */
function clickColorUp(){
    const indexs = getSelectItemIndex();
    setStep(['move', 'color', 'up', indexs]);
    move('color', 'up');
    draw();
    checkButton();
}

/**
 * 新增項目按鈕點擊事件
 */
function clickItemCreate(){
    createItem();
    const items = getItemList();
    const index = items.length - 1;
    const item = items[index];
    item.querySelector('input[data-type="if"]').focus();
    const info = {};
    info['index'] = index;
    info['color'] = item.querySelector('input[type="color"]').value;
    info['if'] = '';
    info['then'] = '';
    setStep(['create', [info]]);
    checkButton();
    draw();
}

/**
 * 移除項目按鈕點擊事件
 */
function clickItemDelete(){
    const [itemToDelete, deleteInfo] = getDeleteInfo();
    setStep(['delete', deleteInfo]);
    deleteItem(itemToDelete);
    checkButton();
    draw();
}

/**
 * 項目下移按鈕點擊事件
 */
function clickItemDown(){
    const indexs = getSelectItemIndex();
    setStep(['move', 'item', 'down', indexs]);
    move('item', 'down');
    draw();
    checkButton();
}

/**
 * 項目上移按鈕點擊事件
 */
function clickItemUp(){
    const indexs = getSelectItemIndex();
    setStep(['move', 'item', 'up', indexs]);
    move('item', 'up');
    draw();
    checkButton();
}

/**
 * 文字下移按鈕點擊事件
 */
function clickTextDown(){
    const indexs = getSelectItemIndex();
    setStep(['move', 'text', 'down', indexs]);
    move('text', 'down');
    draw();
    checkButton();
}

/**
 * 文字上移按鈕點擊事件
 */
function clickTextUp(){
    const indexs = getSelectItemIndex();
    setStep(['move', 'text', 'up', indexs]);
    move('text', 'up');
    draw();
    checkButton();
}

/**
 * 考慮 Unicode 將文字轉成 base64 編碼
 * @param {string} text 要編碼的文字
 * @returns 編碼後的文字
 */
function convertTextToBase64(text){
    const bytes = new TextEncoder().encode(text);
    const chars = [];
    for (const byte of bytes){
        chars.push(String.fromCodePoint(byte));
    }
    return btoa(chars.join(''));
}

/**
 * 考慮 Unicode 將 base64 解碼轉成文字
 * @param {string} base64 要解碼的文字
 * @returns 解碼後的文字
 */
function convertBase64ToText(base64){
    const decoded = atob(base64);
    const chars = [];
    for (const ch of decoded){
        chars.push(ch.codePointAt(0));
    }
    return new TextDecoder().decode(Uint8Array.from(chars));
}

/**
 * 產生新的項目，自動附加在尾端
 */
function createItem(colorValue, ifText, thenText, index){
    const docFrag = document.createDocumentFragment();
    const divItem = document.createElement('div');
    divItem.className = 'item';
    docFrag.appendChild(divItem);
    const divBlock1 = document.createElement('div');
    divBlock1.className = 'item-block';
    divItem.appendChild(divBlock1);
    const divBlock2 = document.createElement('div');
    divBlock1.className = 'item-block';
    divItem.appendChild(divBlock2);
    const checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');
    checkbox.addEventListener('change', checkButton);
    divBlock1.appendChild(checkbox);
    const color = document.createElement('input');
    color.setAttribute('type', 'color');
    color.setAttribute('data-type', 'item-color');
    color.addEventListener('change', changeValue);
    color.value = colorValue ? colorValue : ('#' + getDefaultColor());
    color.setAttribute('data-value', color.value);
    divBlock1.appendChild(color);
    const inputIf = document.createElement('input');
    inputIf.setAttribute('type', 'text');
    inputIf.setAttribute('data-type', 'if');
    inputIf.setAttribute('placeholder', '若…');
    inputIf.value = ifText ? ifText : '';
    inputIf.setAttribute('data-value', inputIf.value);
    inputIf.addEventListener('keyup', draw);
    inputIf.addEventListener('focus', focusTextbox);
    inputIf.addEventListener('change', changeValue);
    divBlock2.appendChild(inputIf);
    const inputThen = document.createElement('input');
    inputThen.setAttribute('type', 'text');
    inputThen.setAttribute('data-type', 'then');
    inputThen.setAttribute('placeholder', '則…');
    inputThen.value = thenText ? thenText : '';
    inputThen.setAttribute('data-value', inputThen.value);
    inputThen.addEventListener('keyup', draw);
    inputThen.addEventListener('focus', focusTextbox);
    inputThen.addEventListener('change', changeValue);
    divBlock2.appendChild(inputThen);

    const itemList = document.getElementById('item-list');
    if (index == undefined){
        itemList.appendChild(docFrag);
    }
    else{
        itemList.insertBefore(docFrag, itemList.children[index]);
    }
}

/**
 * 依傳入變數設置項目
 * @param {object} presetData 傳入變數轉換後的物件
 */
function createPresetData(presetData){
    setText('textTitle', presetData['title']);
    const datas = presetData['data'];
    const n = datas.length;
    for (let i = 0; i < n; i++){
        const data = datas[i];
        createItem(data[0], data[1], data[2]);
    }
    setSelectWidth(presetData['size']);
    setColor('font-color', presetData['fontColor']);
    setColor('canvas-color', presetData['canvasColor']);
    setColor('title-color', presetData['titleColor']);
}

/**
 * 移除選擇的項目
 * @returns 
 */
function deleteItem(itemToDelete){
    if (itemToDelete.length > 0){
        for (const item of itemToDelete){
            remove(item);
        }
    }
}

/**
 * 復原或重做的實作內容
 * @param {any[]} data 復原或重做的資料
 * @returns 對應的動作資料
 */
function doStep(data){
    const recover = [];
    switch(data[0]){
        case 'delete':{
            recover.push('create');
            const deleteInfo = data[1];
            recover.push(deleteInfo);
            const checkIndex = [];
            for (const info of deleteInfo){
                createItem(info['color'], info['if'], info['then'], info['index']);
                checkIndex.push(info['index']);
            }
            selectItem(checkIndex);
            break;
        }
        case 'create':{
            recover.push('delete');
            const createInfo = data[1];
            recover.push(createInfo);
            const checkIndex = [];
            for (const info of createInfo){
                checkIndex.push(info['index']);
            }
            selectItem(checkIndex);
            const itemToDelete = getSelectItem();
            deleteItem(itemToDelete);
            break;
        }
        case 'text': {
            recover.push(data[0]);
            recover.push(data[1]);
            recover.push(data[2]);
            // ['text', 'title-text', 'textTitle', 'foo']
            // ['text', 'if', 3, 'foo']
            const oldValue = setText(data[2], data[3], data[1]);
            recover.push(oldValue);
            break;
        }
        case 'color': {
            recover.push(data[0]);
            recover.push(data[1]);
            // ['color', 'font-color', '#000000']
            // ['color', 3, '#ffffff']
            const oldValue = setColor(data[1], data[2]);
            recover.push(oldValue);
            break;
        }
        case 'move': {
            recover.push(data[0]);
            recover.push(data[1]);
            const recoverIndex = [];
            const indexs = data[3];
            if (data[2] === 'up'){
                recover.push('down');
                for (const index of indexs){
                    recoverIndex.push(index - 1);
                }
            }
            else{
                recover.push('up');
                for (const index of indexs){
                    recoverIndex.push(index + 1);
                }
            }
            recover.push(recoverIndex);
            selectItem(recoverIndex);
            move(data[1], recover[2], recoverIndex);
            break;
        }
        case 'size': {
            recover.push(data[0]);
            const oldValue = setSelectWidth(data[1]);
            recover.push(oldValue);
            break;
        }
    }
    return recover;
}
/**
 * 下載圖檔按鈕點擊事件
 */
function download(){
    const link = document.getElementById('downloadLink');
    link.href = document.getElementById('canvasDownload').toDataURL('image/png');
    let fileName = document.getElementById('textTitle').value.replaceAll('\r', '').replaceAll('\n', '').replaceAll('\t', '').trim();
    if (fileName.length > 0){
        fileName = fileName + '.png';
    }
    else{
        fileName = 'Multiverse.png';
    }
    link.download = fileName;
    link.click();
}

/**
 * 畫圖
 */
function draw(){
    const selectWidth = getValue('size-select');
    const [size, width, height, titleX, ifX, thenX, titleLineHeight, titleY, itemY, itemCount, titleLineCount, arcXstart, arcXend, lineXend, lineWidth, titleRectX, titleRectWidth, titleRectY, titleRectHeight, titleRectRadius, itemArcYstart, itemArcYend] = getPositionInfo(selectWidth);
    setCanvasSize(width, height);
    drawCanvas(size, titleX, ifX, thenX, titleLineHeight, titleY, itemY, itemCount, titleLineCount, arcXstart, arcXend, lineXend, lineWidth, titleRectX, titleRectWidth, titleRectY, titleRectHeight, titleRectRadius, itemArcYstart, itemArcYend);
    transferCanvasToImg();
}

/**
 * 畫圖主動作
 * @param {number} size 一字的px
 * @param {number} titleX 標題文字的 x 起始座標
 * @param {number} ifX 若 文字的 x 起始座標
 * @param {number} thenX 則 文字的 x 起始座標
 * @param {number} titleLineHeight 標題文字每列的高度
 * @param {number} titleY 標題文字的 y 起始座標
 * @param {number[]} itemY 各項目 y 座標
 * @param {number} itemCount 項目數
 * @param {number} titleLineCount 標題列數
 * @param {number} arcXstart 弧線的 x 起始座標
 * @param {number} arcXend 弧線的 x 結束座標
 * @param {number} lineXend 水平線的 x 結束座標
 * @param {number} lineWidth 弧線水平線的線寬
 * @param {number} titleRectX 標題框的 x 座標
 * @param {number} titleRectWidth 標題框的寬
 * @param {number} titleRectY 標題框的 y 座標
 * @param {number} titleRectHeight 標題框的高
 * @param {number} titleRectRadius 標題框的圓弧半徑
 * @param {number} itemArcYstart 弧線的 y 起始座標
 * @param {number[]} itemArcYend 各項目的弧線的 y 結束座標
 */
function drawCanvas(size, titleX, ifX, thenX, titleLineHeight, titleY, itemY, itemCount, titleLineCount, arcXstart, arcXend, lineXend, lineWidth, titleRectX, titleRectWidth, titleRectY, titleRectHeight, titleRectRadius, itemArcYstart, itemArcYend){
    const canvas = document.getElementById('canvasDownload');
    const ctx = canvas.getContext('2d');
    //ctx.fillStyle = window.getComputedStyle(document.querySelector('div.canvas')).backgroundColor;
    const bgColor = getValue('canvas-color');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    document.querySelector('div.canvas').style.backgroundColor = bgColor;
    const titleLines = getTitleLines();
    const ifList = getIfThenTextList('if');
    const thenList = getIfThenTextList('then');
    const colorList = getColorList();
    
    ctx.font = `${size * setting.ifFontSize}px 微軟正黑體`;
    const rx = arcXend - arcXstart;
    for (let i = 0; i < itemCount; i++){
        ctx.beginPath();
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = colorList[i];
        ctx.lineCap = 'round';
        const ifThenTextY = itemY[i];
        const arcYend = itemArcYend[i];
        // 畫曲線
        if (arcYend < itemArcYstart){
            // y座標在中線之上，畫左上的 1/4 橢圓弧，中心x座標, 中心y座標, 橫軸半徑, 縱軸半徑, π 畫到 3/2 π 順時針
            ctx.ellipse(arcXend, itemArcYstart, rx, itemArcYstart - arcYend, 0, Math.PI, 3 * Math.PI / 2, false);
        }
        else if (arcYend == itemArcYstart){
            // y座標恰好是中線，畫水平線
            ctx.moveTo(arcXstart, itemArcYstart);
            ctx.lineTo(arcXend, itemArcYstart);
        }
        else{
            // y座標在中線之下，畫左下的 1/4 橢圓弧，中心x座標, 中心y座標, 橫軸半徑, 縱軸半徑, π 畫到 1/2 π 逆時針
            ctx.ellipse(arcXend, itemArcYstart, rx, arcYend - itemArcYstart, 0, Math.PI, Math.PI / 2, true);
        }
        // 畫水平線
        ctx.lineTo(lineXend, arcYend);
        ctx.stroke();

        // 寫 若 文字
        ctx.fillStyle = getValue('font-color');
        const ifText = ifList[i];
        if (ifText && ifText.length > 0){
            ctx.fillText(ifText, ifX, ifThenTextY);
        }
        // 寫 則 文字
        const thenText = thenList[i];
        if (thenText && thenText.length > 0){
            ctx.fillText(thenText, thenX, ifThenTextY);
        }
    }
    // 畫標題框
    ctx.beginPath();
    ctx.fillStyle = getValue('title-color');
    ctx.lineWidth = 1;
    ctx.roundRect(titleRectX, titleRectY, titleRectWidth, titleRectHeight, titleRectRadius);
    ctx.fill();

    // 寫標題字
    ctx.fillStyle = getValue('font-color');
    ctx.font = `${size * setting.titleFontSize}px 微軟正黑體`;
    for (let i = 0; i < titleLineCount; i++){
        const line = titleLines[i];
        if (line && line.length > 0){
            ctx.fillText(line, titleX, titleY + i * titleLineHeight);
        }
    }
}

/**
 * 輸入框選取時的事件
 * @param {*} event 
 */
function focusTextbox(event){
    const selectedItem = getSelectItem();
    for (const item of selectedItem){
        item.querySelector('input[type="checkbox"]').checked = false;
    }
    const focusItem = event.currentTarget.parentNode.parentNode;
    focusItem.querySelector('input[type="checkbox"]').checked = true;
    checkButton();
}

/**
 * 取得每個項目中 顏色 的列表
 * @returns {string[]}
 */
function getColorList(){
    const result = [];
    const items = getItemList();
    for (const item of items){
        result.push(item.querySelector('input[type="color"]').value);
    }
    return result;
}

/**
 * 選取一個顏色，已存在則跳過，全都存在則選第一個
 * @returns
 */
function getDefaultColor(){
    const usedColorInputs = document.getElementById('item-list').querySelectorAll('input[type="color"]');
    for(const color of colorDefault){
        let isExist = false;
        for(const usedColorInput of usedColorInputs){
            if (usedColorInput.value === '#' + color){
                isExist = true;
                break;
            }
        }
        if (!isExist){
            return color;
        }
    }
    return colorDefault[0];
}

/**
 * 取得刪除項目動作的資訊，做為復原或重做用的資料
 * @returns 
 */
function getDeleteInfo(){
    const items = getItemList();
    const n = items.length;
    const itemToDelete = getSelectItem();
    const deleteInfo = [];
    for (const item of itemToDelete){
        for (let i = 0; i < n; i++){
            if (items[i] === item){
                const info = {};
                info['index'] = i;
                info['color'] = item.querySelector('input[type="color"]').value;
                info['if'] = item.querySelector('input[data-type="if"]').value;
                info['then'] = item.querySelector('input[data-type="then"]').value;
                deleteInfo.push(info);
                break;
            }
        }
    }
    return [itemToDelete, deleteInfo];
}

/**
 * 取得每個項目中 若/則 的文字列表
 * @param {string} type if/then 
 * @returns {string[]}
 */
function getIfThenTextList(type){
    const result = [];
    const items = getItemList();
    for (const item of items){
        result.push(item.querySelector(`input[data-type="${type}"]`).value);
    }
    return result;
}

/**
 * 取得指定項目 dom 所在的編號
 * @param {*} itemToFind 
 * @returns 
 */
function getItemIndex(itemToFind){
    let index = 0;
    const items = getItemList();
    for (const item of items){
        if (item === itemToFind){
            break;
        }
        index++;
    }
    return index;
}

/**
 * 取得項目 DOM 列表
 * @returns {HTMLElement[]}
 */
function getItemList(index){
    if (index == undefined){
        return document.getElementById('item-list').children;
    }
    else{
        return document.getElementById('item-list').children[index];
    }
}

/**
 * 從傳入變數取得已設置的物件
 * @param {string} search 傳入序列化變數
 * @returns {object}
 */
function getPresetData(search){
    const vars = new URLSearchParams(search);
    if (!vars || vars.size === 0){
        return null;
    }
    try {
        const data = vars.get('data');
        return JSON.parse(convertBase64ToText(decodeURIComponent(data)));
    } catch (error) {
        return null;
    }
}

/**
 * 取得畫布需要的各數值
 * @param {} width 
 * @param {*} height 
 * @returns 
 */
function getPositionInfo(width, height){
    
    const titles = getTitleLines();
    const ifs = getIfThenTextList('if');
    const thens = getIfThenTextList('then');
    
    let titleMax = 0, ifMax = 0, thenMax = 0;
    for (const titleWord of titles){
        const length = getTextSize(titleWord);
        if (titleMax < length){
            titleMax = length;
        }
    }
    for (const ifWord of ifs){
        const length = getTextSize(ifWord);
        if (ifMax < length){
            ifMax = length;
        }
    }
    for (const thenWord of thens){
        const length = getTextSize(thenWord);
        if (thenMax < length){
            thenMax = length;
        }
    }

    let size, titleX, ifX, thenX, arcXstart, arcXend, lineXend, titleRectX, titleRectWidth, lineWidth, itemHeight;
    if (width === 'min' || isNaN(width)){
        size = 12;
        width = size * getPositionXratio(titleMax, ifMax, thenMax);
    }
    else{
        width = parseInt(width);
        size = width / getPositionXratio(titleMax, ifMax, thenMax);
    }

    const itemCount = ifs.length;
    const titleLineCount = titles.length;
    itemHeight = (setting.itemMarginTop + setting.ifFontSize + setting.itemLineMargin + setting.lineWidth + setting.itemMarginBottom) * size;
    height = setting.canvasPaddingTop * size + itemHeight * itemCount + setting.canvasPaddingBottom * size;

    titleX = (setting.canvasPaddingLeft + setting.titlePaddingLeft) * size;
    ifX = titleX + (setting.titleFontSize * titleMax / 2 + setting.titlePaddingRight + setting.titleIfMargin + setting.ifPaddingLeft) * size;
    thenX = ifX + (setting.ifPaddingLeft + setting.ifFontSize * ifMax / 2 + setting.ifThenMargin + setting.thenPaddingLeft) * size;
    arcXstart = titleX + (setting.titleFontSize * titleMax / 2) * size;
    arcXend = ifX - setting.ifPaddingLeft * size;
    lineXend = thenX + (setting.thenFontSize * thenMax / 2) * size;
    titleRectX = titleX - setting.titlePaddingLeft * size;
    titleRectWidth = (setting.titleFontSize * titleMax / 2 + setting.titlePaddingLeft + setting.titlePaddingRight) * size;
    lineWidth = setting.lineWidth * size;
    
    const middleY = height / 2;
    const titleLineHeight = setting.titleFontSize * size;
    const itemYfirst = middleY - itemCount / 2 * itemHeight + (setting.itemMarginTop + 1) * setting.ifFontSize * size;
    const lineY = itemYfirst + (setting.itemLineMargin + setting.lineWidth / 2) * size;
    const titleRectHeight = (titleLineCount * setting.titleFontSize + setting.titlePaddingTop + setting.titlePaddingBottom) * size;
    const titleRectRadius = setting.titleRectRadius * size;
    const itemArcYend = [];
    const itemY = [];
    for (let i = 0; i < itemCount; i++){
        itemArcYend.push(lineY + i * itemHeight);
        itemY.push(itemYfirst + i * itemHeight);
    }
    const itemCountHalf = parseInt(itemCount / 2);
    const itemArcYstart = itemCount % 2 === 0 ? ((itemArcYend[itemCountHalf] + itemArcYend[itemCountHalf - 1]) / 2) : (itemArcYend[itemCountHalf]);
    const titleY = itemArcYstart - (titleLineCount / 2 - 1) * titleLineHeight - lineWidth / 2;
    const titleRectY = itemArcYstart - titleRectHeight / 2;
    
    return [size, width, height, titleX, ifX, thenX, titleLineHeight, titleY, itemY, itemCount, titleLineCount, arcXstart, arcXend, lineXend, lineWidth, titleRectX, titleRectWidth, titleRectY, titleRectHeight, titleRectRadius, itemArcYstart, itemArcYend];

}

/**
 * 取得畫布寬的比例
 * @param {number} titleMax 標題最長字數
 * @param {number} ifMax 若 文字最長字數
 * @param {number} thenMax 則 文字最長字數
 * @returns {number}
 */
function getPositionXratio(titleMax, ifMax, thenMax){
    return setting.canvasPaddingLeft + setting.titlePaddingLeft + setting.titleFontSize * titleMax / 2 + setting.titlePaddingRight + setting.titleIfMargin + setting.ifPaddingLeft + setting.ifFontSize * ifMax / 2 + setting.ifPaddingRight + setting.ifThenMargin + setting.thenPaddingLeft + setting.thenFontSize * thenMax / 2+ setting.thenPaddingRight + setting.canvasPaddingRight;
}

/**
 * 取得畫布高的比例
 * @param {number} titleLineCount 標題列數
 * @param {number} itemCount 項目數
 * @returns {number}
 */
function getPositionYratio(titleLineCount, itemCount){
    const byTitle = setting.canvasPaddingTop + setting.titlePaddingTop + setting.titleFontSize * titleLineCount + setting.titlePaddingBottom + itemCount + setting.canvasPaddingBottom;
    const byItem = setting.canvasPaddingTop + (setting.itemMarginTop + setting.ifFontSize + setting.itemLineMargin + setting.lineWidth + setting.itemMarginBottom) * itemCount + setting.canvasPaddingBottom;
    return Math.max(byTitle, byItem);
}

/**
 * 取得勾選中的項目
 * @returns {HTMLElement}
 */
function getSelectCheckbox(){
    return document.getElementById('item-list').querySelectorAll('input[type="checkbox"]:checked');
}

/**
 * 取得目前選取的項目
 * @returns {HTMLElement}
 */
function getSelectItem(){
    const items = getItemList();
    const result = [];
    for (const item of items){
        if(item.querySelector('input[type="checkbox"]:checked')){
            result.push(item);
        }
    }
    return result;
}

/**
 * 取得有選取起來的項目的編號
 * @returns 項目編號
 */
function getSelectItemIndex(){
    const items = getItemList();
    const result = [];
    let index = 0;
    for (const item of items){
        if(item.querySelector('input[type="checkbox"]:checked')){
            result.push(index);
        }
        index++;
    }
    return result;
}

/**
 * 英數字算1字，中日算2字
 * @param {string} text 文字
 * @returns {number} 字串的大小
 */
function getTextSize(text){
    const n = text.length;
    let size = 0;
    for (let i = 0; i < n; i++){
        const ascii = text.charCodeAt(i);
        if (ascii < 256){
            size++;
        }
        else{
            size += 2;
        }
    }
    return size;
}

/**
 * 取得標題文字每一個邛
 * @returns 
 */
function getTitleLines(){
    const title = document.querySelector('textarea').value;
    return (title && title.length > 0) ? title.replaceAll('\r\n', '\n').split('\n') : [];
}

/**
 * 依 id 取得 DOM 的值
 * @param {string} id DOM 的 id
 * @returns 
 */
function getValue(id){
    return document.getElementById(id).value;
}

/**
 * 網頁載入完成後的初始化動作
 */
function initializeBody(){
    initializeEvent();
    resizeWindow();

    const presetData = getPresetData(location.search);
    if (presetData == null){
        useSample();
    }
    else{
        createPresetData(presetData);
    }
    checkButton();
    draw();
}

/**
 * 初始化各 DOM 的事件
 */
function initializeEvent(){
    document.getElementById('size-select').addEventListener('change', changeAndDraw);
    document.getElementById('font-color').addEventListener('change', changeAndDraw);
    document.getElementById('canvas-color').addEventListener('change', changeAndDraw);
    document.getElementById('title-color').addEventListener('change', changeAndDraw);
    document.getElementById('btnCreate').addEventListener('click', clickItemCreate);
    document.getElementById('btnDelete').addEventListener('click', clickItemDelete);
    document.getElementById('btnDownload').addEventListener('click', download);
    document.getElementById('btnLink').addEventListener('click', presetData);
    document.getElementById('btnItemUp').addEventListener('click', clickItemUp);
    document.getElementById('btnItemDown').addEventListener('click', clickItemDown);
    document.getElementById('btnColorUp').addEventListener('click', clickColorUp);
    document.getElementById('btnColorDown').addEventListener('click', clickColorDown);
    document.getElementById('btnTextUp').addEventListener('click', clickTextUp);
    document.getElementById('btnTextDown').addEventListener('click', clickTextDown);
    document.getElementById('btnUndo').addEventListener('click', undo);
    document.getElementById('btnRedo').addEventListener('click', redo);
    document.querySelector('textarea').addEventListener('keyup', draw);
    document.querySelector('textarea').addEventListener('change', changeValue);
    window.addEventListener('resize', resizeWindow);
}

/**
 * 移動項目
 * @param {string} type item/color/text
 * @param {string} direction up/down
 * @param {number[]} indexs 項目的 index
 */
function move(type, direction, indexs){
    if (indexs == undefined){
        indexs = getSelectItemIndex();
    }
    if (indexs.length === 0){
        return;
    }
    const n = getItemList().length;
    if (direction === 'up'){
        for (let i = 0; i < indexs.length; i++){
            const index = indexs[i];
            if (index === 0){
                continue;
            }
            const items = getItemList();
            swap(type, items[index], items[index - 1]);
        }
    }
    else if (direction === 'down'){
        for (let i = indexs.length - 1; i > -1; i--){
            const index = indexs[i];
            if (index === n - 1){
                continue;
            }
            const items = getItemList();
            swap(type, items[index], items[index + 1]);
        }
    }
}

/**
 * 取得連結按鈕的點擊事件，將目前項目轉為資料字串重新跳轉一次
 */
function presetData(){
    const result = {};
    result['title'] = document.querySelector('textarea').value;
    const datas = [];
    const items = getItemList();
    for (const item of items){
        const data = [];
        data.push(item.querySelector('input[type="color"]').value);
        data.push(item.querySelector('input[data-type="if"]').value);
        data.push(item.querySelector('input[data-type="then"]').value);
        datas.push(data);
    }
    result['data'] = datas;
    result['size'] = getValue('size-select');
    result['titleColor'] = getValue('title-color');
    result['fontColor'] = getValue('font-color');
    result['canvasColor'] = getValue('canvas-color');
    // 序列化轉 Base64 再轉網址可接受字元，網頁更新
    const data = encodeURIComponent(convertTextToBase64(JSON.stringify(result)));

    location.href = `index.html?data=${data}`;
}

/**
 * 重做動作
 */
function redo(){
    if (redoList.length === 0){
        return;
    }
    const data = redoList.pop();
    const recover = doStep(data);
    undoList.push(recover);
    draw();
    checkButton();
}

/**
 * 項目移除的主方法
 * @param {HTMLElement} divItem 項目 DOM
 */
function remove(divItem){
    // 移除 checkbox 的 onChange、input 的 onKeyup 和 onFocus 事件
    const checkbox = divItem.querySelector('input[type="checkbox"]');
    checkbox.removeEventListener('change', checkButton);
    const color = divItem.querySelector('input[type="color"]');
    color.removeEventListener('change', changeValue);
    const inputIf = divItem.querySelector('input[data-type="if"]');
    inputIf.removeEventListener('keyup', draw);
    inputIf.removeEventListener('focus', focusTextbox);
    inputIf.removeEventListener('change', changeValue);
    const inputThen = divItem.querySelector('input[data-type="then"]');
    inputThen.removeEventListener('keyup', draw);
    inputThen.removeEventListener('focus', focusTextbox);
    inputThen.removeEventListener('change', changeValue);
    // 移除 child 和本身
    removeNode(divItem);
}

/**
 * 清空 HTML Element，會從最內層的 child node 開始移除
 * @param {HTMLElement} node HTML 節點
 */
function removeNode(node){
    while(node.children && node.children.length > 0){
        removeNode(node.children[0]);
    }
    node.remove();
}

/**
 * 調控按鈕 disabled 的顯示與否
 * @param {string} type up/down/delete
 * @param {boolean} isEnable true顯示/false無法使用
 */
function resetButton(type, isEnable){
    let targetId;
    switch(type){
        // 項目上移、顏色上移、文字上移，是可按還是不可按
        case 'up': targetId = ['btnItemUp', 'btnColorUp', 'btnTextUp']; break;
        // 項目下移、顏色下移、文字下移，是可按還是不可按
        case 'down': targetId = ['btnItemDown', 'btnColorDown', 'btnTextDown']; break;
        // 移除項目，是可按還是不可按
        case 'delete': targetId = ['btnDelete']; break;
        case 'undo': targetId = ['btnUndo']; break;
        case 'redo': targetId = ['btnRedo']; break;
        default: return;
    }

    if (isEnable){
        for (const id of targetId){
            document.getElementById(id).removeAttribute('disabled');
        }
    }
    else{
        for (const id of targetId){
            document.getElementById(id).setAttribute('disabled', true);
        }
    }
}

/**
 * 視窗變更大小的事件
 */
function resizeWindow(){
    let width = window.innerWidth;
    let height = window.innerHeight;
    // 取較小者塞滿
    const length = Math.min(width, height);
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    const divImageWrap = document.querySelector('div.image-wrap');
    const divCanvas = document.querySelector('div.canvas');
    const divControl = document.querySelector('div.control');
    width = length;
    if (isPortrait){
        height = parseInt(length * 3 / 4);
        divImageWrap.style.width = `${width}px`;
        divImageWrap.style.height = `${height}px`;
        divCanvas.style.height = `calc(${height}px + 3rem)`;
        divControl.style.width = '';
        divControl.style.height = `calc(100vh - ${height}px - 3rem)`;
    }
    else{
        divImageWrap.style.width = `${width}px`;
        divImageWrap.style.height = 'calc(100vh - 3rem)';
        divCanvas.style.height = '';
        divControl.style.width = `calc(100vw - ${width}px)`;
        divControl.style.height = '';
    }
}

/**
 * 設置畫布的尺寸
 * @param {number} width 寬
 * @param {number} height 高
 */
function setCanvasSize(width, height){
    const canvas = document.getElementById('canvasDownload');
    canvas.width = width;
    canvas.style.width = `${width}px`;
    canvas.height = height;
    canvas.style.height = `${height}px`;
}

/**
 * 依 id 或編號，設定顏色並回傳原來的值
 * @param {string|number} identifier id 或編號
 * @param {string} rgb 顏色碼
 * @returns 原來的值
 */
function setColor(identifier, rgb){
    const color = isNaN(identifier) ? document.getElementById(identifier) : getItemList(identifier).querySelector('input[type="color"]');
    const oldValue = color.getAttribute('data-value');
    color.value = rgb;
    color.setAttribute('data-value', rgb);
    return oldValue;
}

/**
 * 依指定的編號選取起項目
 * @param {number[]} indexs 指定編號
 */
function selectItem(indexs){
    const selectedList = getSelectCheckbox();
    for (const box of selectedList){
        box.checked = false;
    }
    const items = getItemList();
    for (const index of indexs){
        items[index].querySelector('input[type="checkbox"]').checked = true;
    }
}

/**
 * 設置尺寸的下拉選單
 * @param {string} width 1600/1300/1000/700/min
 */
function setSelectWidth(width){
    const list = document.getElementById('size-select')
    const oldValue = list.getAttribute('data-value');
    list.value = width;
    list.setAttribute('data-value', width);
    return oldValue;
}

/**
 * 設定剛完成的步驟到 undo list
 * @param {Array} data 能夠表示動作的陣列
 */
function setStep(data){
    undoList.push(data);
    if (redoList.length > 0){
        redoList.splice(0, redoList.length);
    }
}

/**
 * 依 id 或編號，設定文字到 if 或 then
 * @param {string|number} identifier id 或編號
 * @param {string} content 文字內容
 * @param {string} type if/then
 * @returns 原文字
 */
function setText(identifier, content, type){
    const textBox = isNaN(identifier) ? document.getElementById(identifier) : getItemList(identifier).querySelector(`input[data-type="${type}"]`);
    const oldValue = textBox.getAttribute('data-value');
    textBox.value = content;
    textBox.setAttribute('data-value', content);
    return oldValue;
}

/**
 * 將兩個項目的內容對調
 * @param {string} type item/color/text
 * @param {HTMLElement} item1 項目1
 * @param {HTMLElement} item2 項目2
 */
function swap(type, item1, item2){
    let temp;
    if (type === 'item' || type === 'color'){
        temp = item1.querySelector('input[type="color"]').value;
        item1.querySelector('input[type="color"]').value = item2.querySelector('input[type="color"]').value;
        item2.querySelector('input[type="color"]').value = temp;
    }
    if (type === 'item' || type === 'text'){
        temp = item1.querySelector('input[data-type="if"]').value;
        item1.querySelector('input[data-type="if"]').value = item2.querySelector('input[data-type="if"]').value;
        item2.querySelector('input[data-type="if"]').value = temp;
        temp = item1.querySelector('input[data-type="then"]').value;
        item1.querySelector('input[data-type="then"]').value = item2.querySelector('input[data-type="then"]').value;
        item2.querySelector('input[data-type="then"]').value = temp;
    }
    temp = item1.querySelector('input[type="checkbox"]').checked;
    item1.querySelector('input[type="checkbox"]').checked = item2.querySelector('input[type="checkbox"]').checked;
    item2.querySelector('input[type="checkbox"]').checked = temp;
}

/**
 * 將 cavans 圖案轉到 img 上
 */
function transferCanvasToImg(){
    const canvas = document.getElementById('canvasDownload');
    document.getElementById('imgShow').src = canvas.toDataURL('image/png');
}

/**
 * 復原動作
 */
function undo(){
    if (undoList.length === 0){
        return;
    }
    const data = undoList.pop();
    const recover = doStep(data);
    redoList.push(recover);
    draw();
    checkButton();
}

/**
 * 使用範本資料
 */
function useSample(){
    setText('textTitle', '蛋的多元宇宙');
    createItem(null, '蛋沒漲價', '不顧蛋農生計');
    createItem(null, '蛋漲價了', '不顧消費者民生');
    createItem(null, '蓋新的養雞場', '不顧環保');
    createItem(null, '不蓋養雞場', '怎不快點增養');
    createItem(null, '進口雞蛋', '不顧蛋農生計');
    createItem(null, '不進口雞蛋', '不顧消費者民生');
    setSelectWidth('1600');
    setColor('font-color', '#000000');
    setColor('canvas-color', '#fff8f4');
    setColor('title-color', '#ffffff');
}