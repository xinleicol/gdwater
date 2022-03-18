
// function xlAlert(condition, massage){
//     return condition? true:console.log(massage)
// }

// let a = xlAlert(0,'hhh')
// // console.log(a);

// function sum() {
//     let length = arguments.length
    
//     let flag = true
//     if (length < 2) {
//         throw new Error('请传入2个以上的参数...')
//     }
//     for (let i = 0; i < length-1; i++) {
//         if (!arguments[i]) {
//             console.log(arguments[length-1]);
//             flag = false
//             break
//         }
//     }
//     return flag      
// }

//  console.log(sum(true,true,false,true,'jjk'))



// var a = [1,2,3]
// function test(){
//     let b =a
//     b.forEach((element) => {
//         if (element > 2) {
//             b.push(3)
//         }
//     }) 
//     console.log(b);
// }

// test()

function test1(b = 1){
    let a = [1,2,3]
    Object.defineProperty(a, 'state',{
        value: true,
        writable:true
    })
    console.log(a.state);
    console.log(b);
}
test1(2)

  