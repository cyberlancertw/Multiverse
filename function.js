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

window.addEventListener('load', initializeBody);

/**
 * 勾選方塊變更時的事件
 * @param {Event} event 
 */
function changeCheckbox(event){
    const isChecked = event.target.checked;
    const allChecked = document.getElementById('item-list').querySelectorAll('input[type="checkbox"]:checked');
    for(const item of allChecked){
        item.checked = false;
    }
    
    event.target.checked = isChecked;
    
    checkButton();

}

/**
 * 更新功能按鈕是否 disable
 */
function checkButton(){
    const selectItem = getSelectItem();
    if (selectItem){
        resetButton('up', selectItem.previousSibling != null);
        resetButton('down', selectItem.nextSibling != null);
        resetButton('delete', true);
    }
    else{
        resetButton('up', false);
        resetButton('down', false);
        resetButton('delete', false);
    }
}

/**
 * 顏色下移按鈕點擊事件
 */
function clickColorDown(){
    move('color', 'down');
}

/**
 * 顏色上移按鈕點擊事件
 */
function clickColorUp(){
    move('color', 'up');
}

/**
 * 新增項目按鈕點擊事件
 */
function clickItemCreate(){
    createItem();
    checkButton();
    draw();
}

/**
 * 移除項目按鈕點擊事件
 */
function clickItemDelete(){
    deleteItem();
    checkButton();
    draw();
}

/**
 * 項目下移按鈕點擊事件
 */
function clickItemDown(){
    move('item', 'down');
}

/**
 * 項目上移按鈕點擊事件
 */
function clickItemUp(){
    move('item', 'up');
}

/**
 * 文字下移按鈕點擊事件
 */
function clickTextDown(){
    move('text', 'down');
}

/**
 * 文字上移按鈕點擊事件
 */
function clickTextUp(){
    move('text', 'up');
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
function createItem(colorValue, ifText, thenText){
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
    checkbox.addEventListener('change', changeCheckbox);
    divBlock1.appendChild(checkbox);
    const color = document.createElement('input');
    color.setAttribute('type', 'color');
    color.addEventListener('change', draw);
    color.value = colorValue ? colorValue : ('#' + getColor());
    divBlock1.appendChild(color);
    const inputIf = document.createElement('input');
    inputIf.setAttribute('type', 'text');
    inputIf.setAttribute('data-type', 'if');
    inputIf.setAttribute('placeholder', '若…');
    inputIf.value = ifText ? ifText : '';
    inputIf.addEventListener('keyup', draw);
    inputIf.addEventListener('focus', focusTextbox);
    divBlock2.appendChild(inputIf);
    const inputThen = document.createElement('input');
    inputThen.setAttribute('type', 'text');
    inputThen.setAttribute('data-type', 'then');
    inputThen.setAttribute('placeholder', '則…');
    inputThen.value = thenText ? thenText : '';
    inputThen.addEventListener('keyup', draw);
    inputThen.addEventListener('focus', focusTextbox);
    divBlock2.appendChild(inputThen);

    document.getElementById('item-list').appendChild(docFrag);
}

/**
 * 依傳入變數設置項目
 * @param {object} presetData 傳入變數轉換後的物件
 */
function createPresetData(presetData){
    document.querySelector('textarea').value = presetData['title'];
    const datas = presetData['data'];
    const n = datas.length;
    for (let i = 0; i < n; i++){
        const data = datas[i];
        createItem(data[0], data[1], data[2]);
    }
    setSelectWidth(presetData['size']);
    setFontColor(presetData['fontColor']);
    setCanvasColor(presetData['canvasColor']);
    setTitleColor(presetData['titleColor']);
}

/**
 * 移除選擇的項目
 * @returns 
 */
function deleteItem(){
    const itemToDelete = getSelectItem();
    if (itemToDelete){
        remove(itemToDelete);
    }
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
    const selectWidth = getSelectSize();
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
    const bgColor = getCanvasColor();
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
        ctx.fillStyle = getFontColor();
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
    ctx.fillStyle = getTitleColor();
    ctx.lineWidth = 1;
    ctx.roundRect(titleRectX, titleRectY, titleRectWidth, titleRectHeight, titleRectRadius);
    ctx.fill();

    // 寫標題字
    ctx.fillStyle = getFontColor();
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
    const focusItem = event.target.parentNode.parentNode;
    const selectedCheckbox = getSelectCheckbox();
    if (selectedCheckbox){
        selectedCheckbox.checked = false;
    }
    focusItem.querySelector('input[type="checkbox"]').checked = true;
    checkButton();
}

/**
 * 取得畫布顏色
 * @returns 
 */
function getCanvasColor(){
    return document.getElementById('colCanvasBg').value;
}

/**
 * 選取一個顏色，已存在則跳過，全都存在則選第一個
 * @returns
 */
function getColor(){
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
 * 取得文字顏色
 * @returns {string}
 */
function getFontColor(){
    return document.getElementById('colFont').value;
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
 * 取得項目 DOM 列表
 * @returns {HTMLElement[]}
 */
function getItemList(){
    return document.getElementById('item-list').children;
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
    return document.getElementById('item-list').querySelector('input[type="checkbox"]:checked');
}

/**
 * 取得目前選取的項目
 * @returns {HTMLElement}
 */
function getSelectItem(){
    const selectCheckbox = getSelectCheckbox();;
    if (!selectCheckbox){
        return null;
    }
    return selectCheckbox.parentNode.parentNode;
}

/**
 * 取得尺寸下拉選單的值
 * @returns {string}
 */
function getSelectSize(){
    return document.getElementById('selSize').value;
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

function getTitleColor(){
    return document.getElementById('colTitleBg').value;
}

function getTitleLines(){
    const title = document.querySelector('textarea').value;
    return (title && title.length > 0) ? title.replaceAll('\r\n', '\n').split('\n') : [];
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
    document.getElementById('selSize').addEventListener('change', draw);
    document.getElementById('colFont').addEventListener('change', draw);
    document.getElementById('colCanvasBg').addEventListener('change', draw);
    document.getElementById('colTitleBg').addEventListener('change', draw);
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
    document.querySelector('textarea').addEventListener('keyup', draw);
    window.addEventListener('resize', resizeWindow);
}

/**
 * 移動項目
 * @param {string} type item/color/text
 * @param {string} direction up/down
 */
function move(type, direction){
    const selectItem = getSelectItem();
    if (!selectItem){
        return;
    }
    if (direction === 'up'){
        if (!selectItem.previousSibling){
            return;
        }
        swap(type, selectItem, selectItem.previousSibling);
    }
    else if (direction === 'down'){
        if (!selectItem.nextSibling){
            return;
        }
        swap(type, selectItem, selectItem.nextSibling);
    }
    draw();
    checkButton();
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
    result['size'] = getSelectSize();
    result['titleColor'] = getTitleColor();
    result['fontColor'] = getFontColor();
    result['canvasColor'] = getCanvasColor();
    // 序列化轉 Base64 再轉網址可接受字元，網頁更新
    const data = encodeURIComponent(convertTextToBase64(JSON.stringify(result)));

    location.href = `index.html?data=${data}`;
}

/**
 * 項目移除的主方法
 * @param {HTMLElement} divItem 項目 DOM
 */
function remove(divItem){
    // 移除 checkbox 的 onChange、input 的 onKeyup 和 onFocus 事件
    const checkbox = divItem.querySelector('input[type="checkbox"]');
    checkbox.removeEventListener('change', changeCheckbox);
    const inputIf = divItem.querySelector('input[data-type="if"]');
    inputIf.removeEventListener('keyup', draw);
    inputIf.removeEventListener('focus', focusTextbox);
    const inputThen = divItem.querySelector('input[data-type="then"]');
    inputThen.removeEventListener('keyup', draw);
    inputThen.removeEventListener('focus', focusTextbox);
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
    const width = window.innerWidth;
    const height = window.innerHeight;
    // 取較小者塞滿
    const length = Math.min(width, height);
    const divCanvas = document.querySelector('div.canvas');
    divCanvas.style.width = `${length}px`;
    divCanvas.style.height = `${length}px`;
}

/**
 * 設置畫在背景顏色
 * @param {string} rgb 色碼
 */
function setCanvasColor(rgb){
    document.getElementById('colCanvasBg').value = rgb;
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
 * 設置文字顏色
 * @param {string} rgb 色碼
 */
function setFontColor(rgb){
    document.getElementById('colFont').value = rgb;
}

/**
 * 設置尺寸的下拉選單
 * @param {string} width 1600/1300/1000/700/min
 */
function setSelectWidth(width){
    document.getElementById('selSize').value = width;
}

/**
 * 設置標題顏色
 * @param {string} rgb 色碼
 */
function setTitleColor(rgb){
    document.getElementById('colTitleBg').value = rgb;
}

/**
 * 設置標題文字
 * @param {string} text 文字
 */
function setTitleText(text){
    document.getElementById('textTitle').value = text;
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
    if(item1.querySelector('input[type="checkbox"]').checked){
        item1.querySelector('input[type="checkbox"]').checked = false;
        item2.querySelector('input[type="checkbox"]').checked = true;
    }
    else{
        item1.querySelector('input[type="checkbox"]').checked = true;
        item2.querySelector('input[type="checkbox"]').checked = false;
    }
}

/**
 * 將 cavans 圖案轉到 img 上
 */
function transferCanvasToImg(){
    const canvas = document.getElementById('canvasDownload');
    document.getElementById('imgShow').src = canvas.toDataURL('image/png');
}

/**
 * 使用範本資料
 */
function useSample(){
    setTitleText('蛋的多元宇宙');
    createItem(null, '蛋沒漲價', '不顧蛋農生計');
    createItem(null, '蛋漲價了', '不顧消費者民生');
    createItem(null, '蓋新的養雞場', '不顧環保');
    createItem(null, '不蓋養雞場', '怎不快點增養');
    createItem(null, '進口雞蛋', '不顧蛋農生計');
    createItem(null, '不進口雞蛋', '不顧消費者民生');
    setSelectWidth('1600');
    setFontColor('#000000');
    setCanvasColor('#fff8f4');
    setTitleColor('#ffffff');
}