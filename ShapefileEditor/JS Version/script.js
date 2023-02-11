var canv = document.getElementById("map"), ctx = canv.getContext("2d"),
fileIn = document.getElementById("fileIn"),
Zoom = document.getElementById("zoom"),
Level = document.getElementById("lvl");

const CW = canv.width, CH = canv.height;
var fi, bytes, camZ = 1, camX = 100, camY = 100;

var CWS, CHS;

class Point{
    static Gen = new Point(0, 0);
    constructor(x, y){
        this.x = x; this.y = y;
    }
    dist(p){
        return Math.sqrt(Math.pow(p.x-this.x, 2) + Math.pow(p.y-this.y, 2));
    }
    fastDist(p){
        return Math.abs(p.x-this.x)*Math.abs(p.y-this.y);
    }
    eq(p){
        if(p == null) return false;
        return this.x == p.x && this.y == p.y;
    }
    set(p){
        this.x = p.x; this.y = p.y;
    }
    set(x, y){
        this.x = x; this.y = y;
    }
    addLocal(p){
        this.x += p.x; this.y += p.y;
    }
    divideLocal(n){
        this.x /= n; this.y /= n;
    }
    getLocal(){
        Point.Gen.x = camZ*(this.x+camX);
        Point.Gen.y = camZ*(this.y+camY);
        return Point.Gen;
    }
    makeGlobal(){
        this.x = this.x/camZ - camX;
        this.y = this.y/camZ - camY;
        return this;
    }
    toString(){
        return "(" + this.x + ", " + this.y + ")";
    }
}

canv.addEventListener("wheel", function(e){
    let scr = e.deltaY < 0 ? 1 : -1, czo = camZ;
    if(scr == 1) camZ *= 1.1;
    else camZ /= 1.1;
    Zoom.innerHTML = camZ;
    CWS = CW-camZ;
    CHS = CH-camZ;
    //camX += canv.width*(czo-camZ)/camZ;
    //camY += canv.height*(czo-camZ)/camZ;
    Poly.Draw();
});

var mx = 0, my = 0, smx, smy;
var selDot = null;

canv.addEventListener("mousemove", function(e){
    smx = e.clientX, smy = e.clientY;
    if(e.buttons == 1){
        camX += (e.clientX - mx)/camZ;
        camY += (e.clientY - my)/camZ;
        selDot = null;
        Poly.Draw();
    }else if(e.buttons == 0 && sels.length == 1){
        var d, md = 1/camZ, mp = null, ref = new Point(e.clientX, e.clientX);
        ref.makeGlobal();
        for(var e of sels[0].elems) for(var p of e.points) if((d = ref.fastDist(p)) < md) md = d, mp = p;
        Poly.Draw();
        if(mp != null) drawDot(mp);
        selDot = mp;
    }
    mx = smx; my = smy;
});

window.addEventListener("keydown", function(e){
    //console.log(e.key);
    switch(e.key){
        case 'f': Poly.Draw(true); break;
        case 'm': mergeRegions(); break;
        case 'x': if(selDot != null) remPoint(); break;
        case 'ArrowUp': viewChange(true); break; //change focus level
        case 'ArrowDown': viewChange(false); break; //change focus level
    }
});

function viewChange(dir){
    viewLevel += dir ? 1 : -1;
    if(viewLevel < 0) viewLevel = 0;
    else if(viewLevel > 4) viewLevel = 4;
    Level.innerHTML = viewLevel;
    Poly.Draw();
}

var px, py, mp = new Point(), sel, ser;
const CLC = CW/10;

canv.addEventListener("mousedown", function(e){
    mp.set(e.x, e.y);
});
var sels = [];
canv.addEventListener("mouseup", function(e){
    if(mp.x != e.x || mp.y != e.y) return;
    if(Poly.l[viewLevel] == undefined) return;
    px = e.x/camZ-camX;
    py = e.y/camZ-camY;
    mp.set(px, py);
    sel = null;
    ser = 1000000000;
    //console.log("(" + px + ", " + py + ")");
    var gen;
    for(var g of Poly.l[viewLevel]) for(var p of g.elems){
        if((gen = p._mean.dist(mp)) < CLC*camZ && gen < ser && p.minX < px && px < p.maxX && p.minY < py && py < p.maxY) sel = g, ser = gen;
    }
    if(sel != null){
        sel.h = !sel.h; Poly.Draw();
        if(sel.h) sels.push(sel);
        else sels.splice(sels.indexOf(sel), 1);
    }
})

function read(n, e = false){
    let ret = 0;
    for(var i = 0; i < n; i++) ret <<= 8, ret += bytes[(wf ? fil : fi)+(e ? i : n-i-1)];
    if(wf) fil += n;
    else fi += n;
    return ret;
}

function readString(n){
    var ret = "", c, fis = fi, N = n;
    while(n-- > 0){
        if((c = read(1, true)) == 0) break;
        ret += String.fromCharCode(c);
    }
    fi = fis + N;
    return ret;
}

function trim(s){
    var i = 0;
    if(s.charAt(0) == ' ') while(s.charAt(i) == ' ') i++;
    var n = s.length;
    if(s.charAt(s.length-1) == ' ') while(s.charAt(n) == ' ') n--;
    return s.substring(i, n);
}

function readField(){
    var ret = [], fis = fi;
    ret[0] = readString(11); //name
    ret[1] = String.fromCharCode(read(1)); //type
    fi += 4;
    ret[2] = read(1);
    fi = fis + 32;
    return ret;
}

function doubleRead(){
    var data = [];
    for(var i = 0; i < 8; i++) data[i] = bytes[(wf ? fil : fi)+8-i-1]; //Double is only ever Little
    if(wf) fil += 8;
    else fi += 8;

    var sign = (data[0] & 1<<7)>>7;

    var exponent = (((data[0] & 127) << 4) | (data[1]&(15<<4))>>4);

    if(exponent == 0) return 0;
    if(exponent == 0x7ff) return (sign) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

    var mul = Math.pow(2,exponent - 1023 - 52);
    var mantissa = data[7]+
        data[6]*Math.pow(2,8*1)+
        data[5]*Math.pow(2,8*2)+
        data[4]*Math.pow(2,8*3)+
        data[3]*Math.pow(2,8*4)+
        data[2]*Math.pow(2,8*5)+
        (data[1]&15)*Math.pow(2,8*6)+
        Math.pow(2,52);

    return Math.pow(-1,sign)*mantissa*mul;
}

var tx, ty;

function pointRead(){
    wf = true; //make exception for which index to affect
    //console.log(read(4)); //type == 1 idk why this needs to be here for every point
    tx = doubleRead();
    ty = doubleRead();
    wf = false;
    return new Point(tx, -ty);
}

var rs, rn, rb, numParts, numPoints, fiSave, fil, sp, cp, pp, wf = false;

var safeCount, fileLevel, viewLevel;

function recordRead(count){
    var fiBase = fi;
    rn = read(4, true);
    rs = read(4, true);
    console.log("(" + rn + ", " + rs + ")");
    fiSave = fi; //bookmark fi
    //START READING CONTENT
    console.log("check type: " + read(4)); //type == 5
    rb = [];
    for(var i = 0; i < 4; i++){
        rb.push(doubleRead());
        console.log("bound " + i + ": " + rb[i]);
    }
    console.log(fi-fiSave);
    numParts = read(4);
    numPoints = read(4);
    console.log("parts: " + numParts + ", points: " + numPoints);
    //START READING THE LISTS
    fil = fi + numParts*4;
    while(numParts-- > 0){
        cp = read(4); //cp = current part
        sp = null;
        let ret = new Poly(cp, fileLevel, count);
        Poly.l[fileLevel][count].elems.push(ret);
        while(true){
            pp = pointRead(); //pp = current point
            if(!pp.eq(sp)){
                ret.add(pp);
                if(sp == null) sp = pp;
            }else break;
        }
        Poly.l[fileLevel][count].mean.addLocal(ret.mean());
        ret.finalize(); //finalize
    }
    Poly.l[fileLevel][count].mean.divideLocal(Poly.l[fileLevel][count].elems.length);
    console.log("DONE!");
    fi = fiSave + rs*2; //position set after this record
}

var diagBound, aFrame, bFrame;

async function readShapeFile(file){
    //var fl = file.name.split(".");
    //if(fl[fl.length-1] != "shp") return console.log("NOT CORRECT TYPE");
    const buf = await file.arrayBuffer();
    bytes = new Uint8Array(buf);
    fi = 0;
    console.log("--> " + read(4, true));
    fi = 24;
    var size = read(4, true)*2-100;
    console.log("==> " + size);
    console.log("~~> " + read(4));
    console.log("::> " + read(4));
    var xl, xr, yl, yr;
    xl = doubleRead();
    yl = doubleRead();
    xr = doubleRead();
    yr = doubleRead();
    //diagBound = Math.abs(xr-xl) * Math.abs(yr-yl);
    diagBound = Math.sqrt(Math.pow(xr-xl, 2) + Math.pow(yr-yl, 2));
    console.log("DIAGBOUND: " + diagBound);
    console.log("xMin: " + xl);
    console.log("yMin: " + yl);
    console.log("xMax: " + xr);
    console.log("yMax: " + yr);
    console.log("zMin: " + doubleRead());
    console.log("zMax: " + doubleRead());
    console.log("mMin: " + doubleRead());
    console.log("mMax: " + doubleRead());
    fi = 100;
    var count = 0;
    while(true){
        Poly.l[fileLevel].push({
            level: fileLevel,
            group: count,
            mean: new Point(0, 0),
            h: false,
            elems: []
        });
        recordRead(count++);
        console.log("EP: " + fi + " or " + fil);
        //Poly.Draw();
        if(isNaN(read(4, true))) break;
        fi -= 4;
    }
    Poly.Draw();
    console.log("FINAL COUNT: " + count);
    console.log(Poly.l[fileLevel]);
    //reconcileData(fileLevel);
}
async function readDBaseFile(file){
    console.log("READING DATA BASE FILE!!!");
    const buf = await file.arrayBuffer();
    bytes = new Uint8Array(buf);
    fi = 0;
    console.log(read(1, true));
    console.log(read(3, true));
    var recNum = read(4);
    console.log("# records: " + recNum);
    console.log("# header bytes: " + read(2));
    console.log("# record bytes: " + read(2));
    console.log("space: " + read(2));
    console.log("flag?: " + read(1, true));
    console.log("encrypt?: " + read(1, true));
    //READING FIELD DESCRIPTOR ARRAY
    fi = 32;
    var cols = [], gen;
    while((gen = readField())[0] != "" && gen[0].charAt(0) != "\r"){ //build the column field headers
        //console.log(gen);
        //gen.push([]);
        cols.push({
            name: gen[0],
            type: gen[1],
            size: gen[2],
            elems: []
        });
    }
    fi -= 30;
    console.log("INFO??? --> " + cols.length);
    while(recNum-- > 0){
        for(var c of cols){
            gen = trim(readString(c.size));
            switch(c.type){
                case 'N': c.elems.push(parseInt(gen)); break;
                case 'F': c.elems.push(parseFloat(gen)); break;
                default: c.elems.push(gen); break; //includes 'C'
            }
        }
        fi++;
    }
    console.log(cols);
    Poly.d[fileLevel] = cols;
    Poly.Draw();
    //reconcileData(fileLevel);
}
function readFile(f){
    var fl = f.name.split(".");
    viewLevel = fileLevel = parseInt(fl[0].split("_adm")[1]);
    Level.innerHTML = viewLevel;
    switch(fl[fl.length-1]){
        case "shp": readShapeFile(f); break;
        case "dbf": readDBaseFile(f); break;
    }
}
fileIn.onchange = function(){
    for(var f of this.files) readFile(f);
}
function drawDot(p){
    ctx.fillStyle="#ff0000";
    ctx.beginPath();
    ctx.arc(camZ*(p.x+camX), camZ*(p.y+camY), camZ**.2, 0, 2*Math.PI);
    ctx.fill();
}
var fx, fy, pLast = new Point(0, 0), dx, dy;
var LOD_SKIP, LOD_STEP, LOD_REF, finSum, li, ni, ci;
var defCol = "#000", mark, Acc = false;
var dots = [];
class Poly{
    static l = [[], [], [], [], []]; //poly struct
    static d = [[], [], [], [], []]; //data struct
    static vis = [true, true, true, true, true]; //vis array
    static Draw(af = false){
        ctx.clearRect(0, 0, canv.width, canv.height);
        for(var d of dots) drawDot(d);
        var p = 0, l, g;
        //if(af) autoFrame();
        if(Poly.l[viewLevel] == undefined) return;
        Acc = af;
        defCol = "#aba99f";
        for(p = 0; p < Poly.l.length; p++){
            if(viewLevel == p) continue;
            if(Poly.vis[p]) for(l of Poly.l[p]){
                if(Poly.d[l.level].length > 0 && Poly.d[l.level][4].elems.length > l.group){ //has data
                    l.mean.getLocal();
                    ctx.fillStyle = l.h ? "#fbbd0c" : defCol;
                    ctx.fillText(Poly.d[l.level][4].elems[l.group], Point.Gen.x, Point.Gen.y);
                }
                for(g of l.elems) g.draw(l.h);
            }
        }
        defCol = "#000";
        for(l of Poly.l[viewLevel]){
            if(Poly.d[l.level].length > 0 && Poly.d[l.level][4].elems.length > l.group){ //has data
                l.mean.getLocal();
                ctx.fillStyle = l.h ? "#fbbd0c" : defCol;
                ctx.fillText(Poly.d[l.level][4].elems[l.group], Point.Gen.x, Point.Gen.y);
            }
            for(g of l.elems) g.draw(l.h);
        }
    }
    constructor(id, fl, gn){
        this.id = id;
        //this.fl = fl; //file level
        //this.gn = gn; //group number
        this.lodRatio = 0.0005;
        this.lodBound = diagBound;
        this.points = [];
        //this.h = false;
        this.clockWise = true;
        this.minX = this.minY = 100000000;
        //this.minY = 0;
        this.maxX = this.maxY = -100000000;
        //this.maxY = 0;
        //Poly.l[fl][gn].push(this);
        //Poly.l[fl][gn].elems.push(this);
    }
    add(p){
        this.minX = Math.min(p.x, this.minX);
        this.minY = Math.min(p.y, this.minY);
        this.maxX = Math.max(p.x, this.maxX);
        this.maxY = Math.max(p.y, this.maxY);
        this.points.push(p);
    }
    get(i){ //circular treatment!!!
        while(i < 0) i += this.points.length;
        while(i >= this.points.length) i -= this.points.length;
        return this.points[i];
    }
    indexOf(p){
        for(var i = 0; i < this.points.length; i++) if(this.points[i].eq(p)) return i;
        return -1;
    }
    isNeighbor(p){
        for(var i of p.points) if(this.indexOf(i) != -1) return true;
        return false;
    }
    [Symbol.iterator](){
        this.i = 0;
        return this;
    }
    next(){
        return{value: this.points[this.i], done: ++this.i >= this.points.length};
    }
    finalize(){ //might not matter
        //console.log("xBounds: (" + this.minX + " to " + this.maxX + ")");
        //console.log("yBounds: (" + this.minY + " to " + this.maxY + ")");
        finSum = 0;
        for(var i = 0; i < this.points.length-1; i++){
            finSum += (this.points[i+1].x-this.points[i].x) * (this.points[i].y+this.points[i+1].y);
        }
        this.clockWise = finSum < 0;
    }
    mean(){
        let m = new Point(0, 0);
        for(var p of this.points) m.addLocal(p);
        m.x /= this.points.length;
        m.y /= this.points.length;
        return (this._mean = m);
    }
    draw(high){ //use camZ for zoom
        if(camZ*(this.maxX+camX) < 0) return;
        if(camZ*(this.minX+camX) > CW) return;
        if(camZ*(this.maxY+camY) < 0) return;
        if(camZ*(this.minY+camY) > CH) return;
        //drawDot(this.points[0]);
        ctx.beginPath();
        ctx.strokeStyle = high ? "#fbbd0c" : defCol;
        //accTally = 1;
        LOD_STEP = 100;
        LOD_SKIP = this.lodRatio * this.lodBound / camZ / camZ;
        aFrame = true; bFrame = false;
        var f = this.points[0]; LOD_REF = f;
        fx = camZ*(f.x + camX);
        fy = camZ*(f.y + camY);
        mark = 0;
        //pLast.set(undefined, undefined); //pLast.set(fx, fy);
        ctx.moveTo(fx, fy);
        for(var i = 1; i < this.points.length; i++){ //need to optimize this
            //i % LOD_STEP == 0 && 
            if(!Acc && LOD_REF.fastDist(this.points[i]) < LOD_SKIP) continue;
            LOD_REF = this.points[i];
            fx = camZ*(LOD_REF.x+camX);
            fy = camZ*(LOD_REF.y+camY);
            if((fx < 0 || fx > CW) && (fy < 0 || fy > CH)) continue;
            ctx.lineTo(fx, fy);
        }
        fx = camZ*(f.x + camX);
        fy = camZ*(f.y + camY);
        if(fx > 0 && fx < CW && fy > 0 && fy < CH) ctx.lineTo(fx, fy);
        ctx.stroke();
        LOD_REF = null;
        //console.log(accTally / this.points.length);
    }
}

function remPoint(){
    for(var l of Poly.l) for(var g of l) for(var e of g.elems)
        if(e.minX <= selDot.x && e.maxX >= selDot.x && e.minY <= selDot.y && e.maxY >= selDot.y)
            for(var i = 0; i < e.points.length; i++) if(selDot.eq(e.points[i])){
                e.points.splice(i, 1);
                break;
            }
    selDot = null;
    Poly.Draw();
}

function merge(A, B, level, group){
    //START:::
    var aBeg = 0, aLim = A.points.length, p; //starting info
    while(true){
        if(B.indexOf(A.get(aBeg)) == -1) break;
        else aBeg--, aLim--;
    }
    //FIND POINTS A AND C:::
    var ln = false, first = null, last = null;
    for(var i = aBeg; i < aLim; i++){
        p = A.get(i);
        if(B.indexOf(p) == -1){if(ln) last = A.get(i-1); ln = false;}
        else{if(first == null) first = p; ln = true;}
    }
    //dots.push(first);
    //dots.push(last);
    /*if(Math.abs(A.indexOf(first) - A.indexOf(last)) >= A.points.length/2){ //swap save~~~
        p = last;
        last = first;
        first = p;
    }*/
    //ACTUALLY BUILD MERGED POLY:::
    var ret = new Poly(parseInt(A.id) + parseInt(B.id) / 1000, level, group);
    var wh = B, ind;
    ret.add(first);
    p = B.get(ind = B.indexOf(first)+1); //joint B1
    while(!p.eq(first)){
        if(p.eq(last)){
            wh = A;
            p = A.get(ind = A.indexOf(last)); //include last --> joint A2
        }
        ret.add(p);
        p = wh.get(++ind);
    }
    ret.add(first);
    ret.mean();
    ret.finalize();
    return ret;
}

function mergeRegions(){
    if(sels.length != 2) return;
    console.log(sels[0]);
    console.log(sels[1]);
    var rx = sels[1].level, ry = sels[1].group;
    while(true){
        var pass = true;
        for(var i = 0; i < sels[0].elems.length; i++){
            for(var n = 0; n < sels[1].elems.length; n++){
                if(sels[0].elems[i].isNeighbor(sels[1].elems[n])){
                    var m = merge(sels[0].elems[i], sels[1].elems[n], sels[0].level, sels[0].group);
                    console.log(m);
                    sels[0].elems.splice(i, 1);
                    sels[1].elems.splice(n, 1);
                    sels[0].elems.push(m);
                    pass = false; break;
                }
            }
            if(!pass) break;
        }
        if(pass) break;
    }
    for(var e of sels[1].elems) sels[0].elems.push(e); //make sure to save the islands
    Poly.l[rx].splice(ry, 1);
    if(Poly.d[rx][4] != undefined) Poly.d[rx][4].elems[sels[0].group] += "/" + Poly.d[rx][4].elems[ry]; //merge names
    //for(var i of Poly.d[rx]) i.elems.splice(ry, 1);
    sels.splice(1, 1);
    Poly.Draw();
}

function autoFrame(){

}

function start(){

}

start();