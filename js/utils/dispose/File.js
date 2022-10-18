


function saveData() {
    let m = 55;
    let r = localStorage.getItem('radio')
    let corner = localStorage.getItem('corner')
    let mark = localStorage.getItem(m)
    let wM = m+'waterMatrix';
    let waterMatrix = JSON.parse(localStorage.getItem(wM))
    let exaggerateMatrix = JSON.parse(localStorage.getItem('exaggerateMatrix'))
    let waterCornerMatrix = JSON.parse(localStorage.getItem('waterCornerMatrix'))

    let data = {
        m : mark,
        'radio' : r,
        'corner' : corner,
        wM : waterMatrix,
        'exaggerateMatrix' : exaggerateMatrix,
        'waterCornerMatrix' : waterCornerMatrix,
    }

    console.log(JSON.stringify(data));
}

saveData();