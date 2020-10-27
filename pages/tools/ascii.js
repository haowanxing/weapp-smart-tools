Page({

  data: {
    ascii:['NUT','SOH','STX','ETX','EOT','ENQ','ACK','BEL','BS','HT','LF','VT','FF','CR','SO','SI','DLE','DCI','DC2','DC3','DC4','NAK','SYN','TB','CAN','EM','SUB','ESC','FS','GS','RS','US','(space)']
  },
  onLoad: function (options) {
    let cii = this.data.ascii;
    for(let i = 33; i < 127; i++){
      cii[i] = String.fromCharCode(i);
    }
    cii[127] = 'DEL';
    this.setData({ascii: cii});
  },
  toHex: function(num){
    console.log(num, (num).toString(16))
    return (num).toString(16);
  }
})