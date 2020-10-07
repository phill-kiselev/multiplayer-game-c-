var canvas = document.getElementById("renderCanvas"); // Get the canvas element
var engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

let divFps = document.getElementById("fps");

let socket = new WebSocket("ws://127.0.0.1:8000");

socket.onopen = function(e) {
  alert("[open] Соединение установлено");
  //alert("Отправляем данные на сервер");
  //socket.send("qweqweqwe");
};

var BUF_GO = new Array();

socket.onmessage = function(event) {
  //alert(`[message] Данные получены с сервера: ${event.data}`);
  console.log(event.data);
  let ar = event.data.split(" ");
  BUF_GO.push([parseFloat(ar[0]), parseFloat(ar[1])]);
};

socket.onclose = function(event) {
  if (event.wasClean) {
    alert(`[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
  } else {
    // например, сервер убил процесс или сеть недоступна
    // обычно в этом случае event.code 1006
    alert('[close] Соединение прервано');
  }
};

socket.onerror = function(error) {
  alert(`[error] ${error.message}`);
};

var _MOVE_TO = {
    isquest: false,
    x: 0,
    z: 0,
    k: 0,
};
var _STATE_PLAYER = {
    angle: new BABYLON.Vector2(0,1),
};
_STATE_ATTACK = {
    is_attack_repaire: false,
    is_attack_ready: false,
    coords: null
};

var ICE_DIST = 25;

var IS_NPC_CHECKED = false;

var _RADIUS = 0.15;
var Xm = 3, Ym = 3;
var health_main = 100;
var health_npc = 100;
var NPC_IS_PICKED = false;
var GRAVITY = -5;

function rotate_vec_delta(x, y, ang=0.01) {
    return new BABYLON.Vector2(x * Math.cos(ang) - y * Math.sin(ang), x * Math.sin(ang) + y * Math.cos(ang));
}

function count_angle_rotate(r1 = new BABYLON.Vector2(0,-1), r2 = new BABYLON.Vector2(0,1)) {
    let cosA = (r1.x*r2.x + r1.y*r2.y) / (r1.length() * r2.length());
    let r1_new = rotate_vec_delta(r1.x, r1.y);
    let cosA1 = (r1_new.x*r2.x + r1_new.y*r2.y) / (r1_new.length() * r2.length());
    return  (Math.acos(cosA1) <= Math.acos(cosA)) ? -Math.acos(cosA) : Math.acos(cosA);
}

/******* Add the create scene function ******/
var createScene = function () {

    // Create the scene space
    var scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled=true;
    scene.gravity = new BABYLON.Vector3(0, GRAVITY, 0);

    // Add a camera to the scene and attach it to the canvas
    var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 5, 15, new BABYLON.Vector3(0,0,1), scene);
    camera.attachControl(canvas, true);
    //scene.activeCamera.panningSensibility = 800;
    camera.checkCollisions=false;
    //camera.applyGravity = true;
    //scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
    //camera.applyGravity = true;
    //camera.ellipsoid = new BABYLON.Vector3(0.2, 0.2, 0.2);

    function doDownload(filename, mesh) {
        if(objectUrl) {
            window.URL.revokeObjectURL(objectUrl);
        }
        var serializedMesh = BABYLON.SceneSerializer.SerializeMesh(mesh);
        var strMesh = JSON.stringify(serializedMesh);
        if (filename.toLowerCase().lastIndexOf(".babylon") !== filename.length - 8 || filename.length < 9) {
            filename += ".babylon";
        }
        var blob = new Blob ( [ strMesh ], { type : "octet/stream" } );
        // turn blob into an object URL; saved as a member, so can be cleaned out later
        objectUrl = (window.webkitURL || window.URL).createObjectURL(blob);
        var link = window.document.createElement('a');
        link.href = objectUrl;
        link.download = filename;
        var click = document.createEvent("MouseEvents");
        click.initEvent("click", true, false);
        link.dispatchEvent(click);
    }



    // Add lights to the scene
    var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
    var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(5, 1, -1), scene);

    const highlight = new BABYLON.HighlightLayer('highlight', scene);

    var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
	groundMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.5);
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {height: 14*4, width: 19*4, subdivisions: 4}, scene);
    ground.material = groundMat;
    ground.position = new BABYLON.Vector3(-28,0,-20);
    ground.checkCollisions = true;

    var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
	groundMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.5);
    var ground_ups = BABYLON.MeshBuilder.CreateGround("groundU", {height: 7, width: 18, subdivisions: 4}, scene);
    ground_ups.material = groundMat;
    ground_ups.position = new BABYLON.Vector3(18,2.5,-3.5);
    ground_ups.rotation.z = Math.PI / 10;
    ground_ups.checkCollisions = true;

    //var ground_ups = BABYLON.MeshBuilder.CreateGround("groundU", {height: 7, width: 7, subdivisions: 4}, scene);
    //var ground_ups = BABYLON.MeshBuilder.CreateGround("groundU", {height: 7, width: 7, subdivisions: 4}, scene);

    var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
	groundMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.5);
    var ground_down = BABYLON.MeshBuilder.CreateGround("groundD", {height: 7, width: 16, subdivisions: 4}, scene);
    ground_down.material = groundMat;
    ground_down.position = new BABYLON.Vector3(17.5,-2.5,3.5);
    ground_down.rotation.z = - Math.PI / 10;
    ground_down.checkCollisions = true;

    //var ground_ups = BABYLON.MeshBuilder.CreateGround("groundU", {height: 7, width: 7, subdivisions: 4}, scene);
    //var ground_ups = BABYLON.MeshBuilder.CreateGround("groundU", {height: 7, width: 7, subdivisions: 4}, scene);

    var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
	groundMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.5);
    var ground_minus1 = BABYLON.MeshBuilder.CreateGround("groundM", {height: 14, width: 18, subdivisions: 4}, scene);
    ground_minus1.material = groundMat;
    ground_minus1.position = new BABYLON.Vector3(32,-5,0);
    ground_minus1.checkCollisions = true;

    var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
	groundMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.5);
    var ground_plus1 = BABYLON.MeshBuilder.CreateGround("groundP", {height: 14, width: 18, subdivisions: 4}, scene);
    ground_plus1.material = groundMat;
    ground_plus1.position = new BABYLON.Vector3(32,5,0);
    ground_plus1.checkCollisions = true;

    var grounds = [ground, ground_ups, ground_down, ground_plus1, ground_minus1];


    // -----------------------------------------------------------------
    // NODE MATERIAL
    // -----------------------------------------------------------------
    var nodeMaterial = new BABYLON.NodeMaterial("node");

    // InputBlock
    var position = new BABYLON.InputBlock("position");
    position.setAsAttribute("position");

    // TransformBlock
    var WorldPos = new BABYLON.TransformBlock("WorldPos");
    WorldPos.complementZ = 0;
    WorldPos.complementW = 1;

    // InputBlock
    var World = new BABYLON.InputBlock("World");
    World.setAsSystemValue(BABYLON.NodeMaterialSystemValues.World);

    // TransformBlock
    var Worldposition = new BABYLON.TransformBlock("World position");
    Worldposition.complementZ = 0;
    Worldposition.complementW = 1;

    // LightBlock
    var Lights = new BABYLON.LightBlock("Lights");

    // InputBlock
    var cameraPosition = new BABYLON.InputBlock("cameraPosition");
    cameraPosition.setAsSystemValue(BABYLON.NodeMaterialSystemValues.CameraPosition);

    // InputBlock
    var Float = new BABYLON.InputBlock("Float");
    Float.value = 0.28;
    Float.min = 0;
    Float.max = 1;
    Float.isBoolean = false;
    Float.matrixMode = 0;
    Float.animationType = BABYLON.AnimatedInputBlockTypes.None;
    Float.isConstant = false;
    Float.visibleInInspector = true;

    // InputBlock
    var Float1 = new BABYLON.InputBlock("Float");
    Float1.value = 512;
    Float1.min = 0;
    Float1.max = 512;
    Float1.isBoolean = false;
    Float1.matrixMode = 0;
    Float1.animationType = BABYLON.AnimatedInputBlockTypes.None;
    Float1.isConstant = true;
    Float1.visibleInInspector = false;

    // InputBlock
    var Color = new BABYLON.InputBlock("Color3");
    Color.value = new BABYLON.Color3(0.12941176470588237, 0.27058823529411763, 0.27450980392156865);
    Color.isConstant = false;
    Color.visibleInInspector = false;

    // TextureBlock
    var Texture = new BABYLON.TextureBlock("Texture");
    Texture.texture = new BABYLON.Texture("models/Ice_001_SPEC.jpg", null);
    Texture.texture.wrapU = 1;
    Texture.texture.wrapV = 1;
    Texture.texture.uAng = 0;
    Texture.texture.vAng = 0;
    Texture.texture.wAng = 0;
    Texture.texture.uOffset = 0;
    Texture.texture.vOffset = 0;
    Texture.texture.uScale = 1;
    Texture.texture.vScale = 1;
    Texture.convertToGammaSpace = false;

    // InputBlock
    var uv = new BABYLON.InputBlock("uv");
    uv.setAsAttribute("uv");

    // TextureBlock
    var Texture1 = new BABYLON.TextureBlock("Texture");
    Texture1.texture = new BABYLON.Texture("models/Ice_001_COLOR.jpg", null);
    Texture1.texture.wrapU = 1;
    Texture1.texture.wrapV = 1;
    Texture1.texture.uAng = 0;
    Texture1.texture.vAng = 0;
    Texture1.texture.wAng = 0;
    Texture1.texture.uOffset = 0;
    Texture1.texture.vOffset = 0;
    Texture1.texture.uScale = 1;
    Texture1.texture.vScale = 1;
    Texture1.convertToGammaSpace = false;

    // AddBlock
    var Add = new BABYLON.AddBlock("Add");

    // InputBlock
    var Color1 = new BABYLON.InputBlock("Color3");
    Color1.value = new BABYLON.Color3(0.23137254901960785, 0.7764705882352941, 0.8549019607843137);
    Color1.isConstant = false;
    Color1.visibleInInspector = false;

    // AddBlock
    var Add1 = new BABYLON.AddBlock("Add");

    // AddBlock
    var Add2 = new BABYLON.AddBlock("Add");

    // FragmentOutputBlock
    var FragmentOutput = new BABYLON.FragmentOutputBlock("FragmentOutput");

    // TransformBlock
    var WorldPosViewProjectionTransform = new BABYLON.TransformBlock("WorldPos * ViewProjectionTransform");
    WorldPosViewProjectionTransform.complementZ = 0;
    WorldPosViewProjectionTransform.complementW = 1;

    // InputBlock
    var ViewProjection = new BABYLON.InputBlock("ViewProjection");
    ViewProjection.setAsSystemValue(BABYLON.NodeMaterialSystemValues.ViewProjection);

    // VertexOutputBlock
    var VertexOutput = new BABYLON.VertexOutputBlock("VertexOutput");

    // Connections
    position.output.connectTo(WorldPos.vector);
    World.output.connectTo(WorldPos.transform);
    WorldPos.output.connectTo(WorldPosViewProjectionTransform.vector);
    ViewProjection.output.connectTo(WorldPosViewProjectionTransform.transform);
    WorldPosViewProjectionTransform.output.connectTo(VertexOutput.vector);
    uv.output.connectTo(Texture1.uv);
    Texture1.rgb.connectTo(Add.left);
    Color1.output.connectTo(Add.right);
    Add.output.connectTo(Add1.left);
    WorldPos.output.connectTo(Lights.worldPosition);
    position.output.connectTo(Worldposition.vector);
    World.output.connectTo(Worldposition.transform);
    Worldposition.output.connectTo(Lights.worldNormal);
    cameraPosition.output.connectTo(Lights.cameraPosition);
    Float.output.connectTo(Lights.glossiness);
    Float1.output.connectTo(Lights.glossPower);
    Color.output.connectTo(Lights.diffuseColor);
    uv.output.connectTo(Texture.uv);
    Texture.rgb.connectTo(Lights.specularColor);
    Lights.diffuseOutput.connectTo(Add2.left);
    Lights.specularOutput.connectTo(Add2.right);
    Add2.output.connectTo(Add1.right);
    Add1.output.connectTo(FragmentOutput.rgb);

    // Output nodes
    nodeMaterial.addOutputNode(VertexOutput);
    nodeMaterial.addOutputNode(FragmentOutput);
    nodeMaterial.build();

    // --------------------------------------------------------------



      // pylons (obstacles)
      var pyl_mat = new BABYLON.StandardMaterial("pyl_mat", scene);
      pyl_mat.diffuseColor = new BABYLON.Color3(0.8, 0.9, 0.3);
      obj=BABYLON.MeshBuilder.CreateCylinder('qwe',{diameterTop: 2,diameterBottom: 2,height: 0.9,tessellation: 16},scene );
      obj.position = new BABYLON.Vector3(Xm,0,Ym);
      obj.checkCollisions=true;
      obj.material=pyl_mat;
      var size = obj.getBoundingInfo().boundingBox.extendSize;
      //console.log(size);

      var player = null;//BABYLON.MeshBuilder.CreateCylinder("player", {height: 0.5, diameter: 0.05, tessellation: 6}, scene);
      //player.position = new BABYLON.Vector3(0,0,0);
      //player.checkCollisions=true;

      var NPC = null; //BABYLON.MeshBuilder.CreateCylinder("NPC", {height: 0.5, diameter: 0.05, tessellation: 6}, scene);
      //NPC.position = new BABYLON.Vector3(0,0,0);
      //NPC.checkCollisions=true;

      // show axis
      var showAxis = function(size, pos = new BABYLON.Vector3(0,0,0)) {
        var makeTextPlane = function(text, color, size) {
            var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
            dynamicTexture.hasAlpha = true;
            dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color , "transparent", true);
            var plane = new BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
            plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
            plane.material.backFaceCulling = false;
            plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
            plane.material.diffuseTexture = dynamicTexture;
            return plane;
        };

        const x0 = pos.x, y0 = pos.y, z0 = pos.z;
        var axisX = BABYLON.Mesh.CreateLines("axisX", [
          new BABYLON.Vector3(0+x0, 0+y0, 0+z0), new BABYLON.Vector3(size+x0, 0+y0, 0+z0),
          new BABYLON.Vector3(size * 0.95+x0, 0.05 * size+y0, 0+z0),
          new BABYLON.Vector3(size+x0, 0+y0, 0+z0), new BABYLON.Vector3(size * 0.95+x0, -0.05 * size+y0, 0+z0)
          ], scene);
        axisX.color = new BABYLON.Color3(1, 0, 0);
        var xChar = makeTextPlane("X", "red", size / 10);
        xChar.position = new BABYLON.Vector3(0.9 * size+x0, -0.05 * size+y0, 0+z0);
        var axisY = BABYLON.Mesh.CreateLines("axisY", [
            new BABYLON.Vector3(0+x0, 0+y0, 0+z0), new BABYLON.Vector3(0+x0, size+y0, 0+z0),
            new BABYLON.Vector3( -0.05 * size+x0, size * 0.95+y0, 0+z0),
            new BABYLON.Vector3(0+x0, size+y0, 0+z0), new BABYLON.Vector3( 0.05 * size+x0, size * 0.95+y0, 0+z0)
            ], scene);
        axisY.color = new BABYLON.Color3(0, 1, 0);
        var yChar = makeTextPlane("Y", "green", size / 10);
        yChar.position = new BABYLON.Vector3(0+x0, 0.9 * size+y0, -0.05 * size+z0);
        var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
            new BABYLON.Vector3(0+x0, 0+y0, 0+z0), new BABYLON.Vector3(0+x0, 0+y0, size+z0),
            new BABYLON.Vector3( 0+x0 , -0.05 * size+y0, size * 0.95+z0),
            new BABYLON.Vector3(0+x0, 0+y0, size+z0), new BABYLON.Vector3( 0+x0, 0.05 * size+y0, size * 0.95+z0)
            ], scene);
        axisZ.color = new BABYLON.Color3(0, 0, 1);
        var zChar = makeTextPlane("Z", "blue", size / 10);
        zChar.position = new BABYLON.Vector3(0+x0, 0.05 * size+y0, 0.9 * size+z0);
      };

      // show axis
      var showLocalAxis = function(size, pos = new BABYLON.Vector3(0,0,0)) {
        var makeTextPlane = function(text, color, size) {
            var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
            dynamicTexture.hasAlpha = true;
            dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color , "transparent", true);
            var plane = new BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
            plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
            plane.material.backFaceCulling = false;
            plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
            plane.material.diffuseTexture = dynamicTexture;
            return plane;
        };

        const x0 = pos.x, y0 = pos.y, z0 = pos.z;
        size = -size;
        var axisX = BABYLON.Mesh.CreateLines("axisX", [
          new BABYLON.Vector3(0+x0, 0+y0, 0+z0), new BABYLON.Vector3(size+x0, 0+y0, 0+z0),
          new BABYLON.Vector3(size * 0.95+x0, 0.05 * size+y0, 0+z0),
          new BABYLON.Vector3(size+x0, 0+y0, 0+z0), new BABYLON.Vector3(size * 0.95+x0, -0.05 * size+y0, 0+z0)
          ], scene);
        axisX.color = new BABYLON.Color3(1, 0, 0);
        //var xChar = makeTextPlane("X", "red", size / 10);
        //xChar.position = new BABYLON.Vector3(0.9 * size+x0, 0.05 * size+y0, 0+z0);
        var axisY = BABYLON.Mesh.CreateLines("axisY", [
            new BABYLON.Vector3(0+x0, 0+y0, 0+z0), new BABYLON.Vector3(0+x0, -size+y0, 0+z0),
            new BABYLON.Vector3( -0.05 * size+x0, -size * 0.95+y0, 0+z0),
            new BABYLON.Vector3(0+x0, -size+y0, 0+z0), new BABYLON.Vector3( 0.05 * size+x0, -size * 0.95+y0, 0+z0)
            ], scene);
        axisY.color = new BABYLON.Color3(0, 1, 0);
        //var yChar = makeTextPlane("Y", "green", size / 10);
        //yChar.position = new BABYLON.Vector3(0+x0, -0.9 * size+y0, -0.05 * size+z0);
        var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
            new BABYLON.Vector3(0+x0, 0+y0, 0+z0), new BABYLON.Vector3(0+x0, 0+y0, size+z0),
            new BABYLON.Vector3( 0+x0 , -0.05 * size+y0, size * 0.95+z0),
            new BABYLON.Vector3(0+x0, 0+y0, size+z0), new BABYLON.Vector3( 0+x0, 0.05 * size+y0, size * 0.95+z0)
            ], scene);
        axisZ.color = new BABYLON.Color3(0, 0, 1);
        //var zChar = makeTextPlane("Z", "blue", size / 10);
        //zChar.position = new BABYLON.Vector3(0+x0, -0.05 * size+y0, 0.9 * size+z0);

        axisX.parent = player;
        axisY.parent = player;
        axisZ.parent = player;
      };

      showAxis(5);

   NPCFEATS = {
        skeletonNPC: null,
        animations: {
            Death_back: null,
            Death_forward: null,
            Fly: null,
            Hit1: null,
            Hit2: null,
            Idle: null,
            Spell_item: null,
            Taking_damage: null,
            Walk: null,
            Walk_End: null,
            Walk_start: null
        },
        healthBarContainer: null,
        healthBarG: null,
        dynamicTexture1: null,
        textureContext1: null
   };
   PLAYERFEATS = {
        staff: null,
        skeletonNPC: null,
        animations: {
            Death_back: null,
            Death_forward: null,
            Fly: null,
            Hit1: null,
            Hit2: null,
            Idle: null,
            Spell_item: null,
            Taking_damage: null,
            Walk: null,
            Walk_End: null,
            Walk_start: null
        },
        healthBarContainer: null,
        healthBarG: null,
        dynamicTexture1: null,
        textureContext1: null
   };


//   let path = [];
//   let radius = 5;
//   let deltaTheta = 0.01;
//   for(var theta = 0; theta < 2 * Math.PI; theta +=deltaTheta ) {
//        path.push(new BABYLON.Vector3(radius * Math.cos(theta), radius * Math.sin(theta), 0));
//   }
//   var mySinusCurve = new BABYLON.Curve3(path);

    NPC_STATE = {
        state: "stand", // stand || run_follow || attack || run_back
        _MOVE_TO: {},
        _dist_from_null: 0,
        _dist_to_player: null,
    };
    PLAYER_STATE = {
        state: "stand", // stand || run || attack_repaire || attack_ready
        _MOVE_TO: {},
        _FLY_TO: {},
        
    };

    //BABYLON.SceneLoader.ImportMesh("", "models/", "HUB_babylon.babylon", scene, function (newMeshes, particleSystems, skeletons)  {
        //let HUB = newMeshes[5];
        //NPC.position = new BABYLON.Vector3(-3, 0.35, -3);
	//});



   BABYLON.SceneLoader.ImportMesh("", "models/", "Mages_1to4_babylon.babylon", scene, function (newMeshes, particleSystems, skeletons) {

        var magemat = new BABYLON.StandardMaterial("qwewqe", scene);
        magemat.ambientTexture = new BABYLON.Texture("models/MagesTexture.png", scene);

        //var npcBox = BABYLON.MeshBuilder.CreateCylinder("npcbox", {diameter: size.x, height: size.y, tessellation: 26}, scene);
        //npcBox.position = NPC.position;

        newMeshes[0].dispose();
        newMeshes[1].dispose();
        newMeshes[2].dispose();
        //newMeshes[3].dispose();
        newMeshes[4].dispose();
        //newMeshes[5].dispose();
        newMeshes[6].dispose();
        newMeshes[7].dispose();

        //NPC.dispose() ;
        NPC = newMeshes[5];
        NPC.position = new BABYLON.Vector3(-3, 0.35, -3);
        NPC.material = magemat;

        let p = newMeshes[3];
        p.parent = NPC;
        p.material = magemat;
        NPCFEATS.staff = p;

        //NPC.checkCollisions = true;
        NPC.ellipsoid = new BABYLON.Vector3(0.1, .1, 0.1);
        NPC.applyGravity = true;

        NPCFEATS.skeletonNPC = skeletons[0];
        // ROBOT
        NPCFEATS.skeletonNPC.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
        NPCFEATS.skeletonNPC.animationPropertiesOverride.enableBlending = true;
        NPCFEATS.skeletonNPC.animationPropertiesOverride.blendingSpeed = 0.05;
        NPCFEATS.skeletonNPC.animationPropertiesOverride.loopMode = 1;

        NPCFEATS.skeletonNPC.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
        NPCFEATS.skeletonNPC.animationPropertiesOverride.enableBlending = true;
        NPCFEATS.skeletonNPC.animationPropertiesOverride.blendingSpeed = 0.05;
        NPCFEATS.skeletonNPC.animationPropertiesOverride.loopMode = 1;
        // Death_back Death_forward Fly Hit1 Hit2 Idle Spell_item Taking_damage Walk Walk_End Walk_start
        NPCFEATS.animations.Death_back = NPCFEATS.skeletonNPC.getAnimationRange("Death_back");
        NPCFEATS.animations.Death_forward = NPCFEATS.skeletonNPC.getAnimationRange("Death_forward");
        NPCFEATS.animations.Fly = NPCFEATS.skeletonNPC.getAnimationRange("Fly");
        NPCFEATS.animations.Hit1 = NPCFEATS.skeletonNPC.getAnimationRange("Hit1");
        NPCFEATS.animations.Hit2 = NPCFEATS.skeletonNPC.getAnimationRange("Hit2");
        NPCFEATS.animations.Idle = NPCFEATS.skeletonNPC.getAnimationRange("Idle");
        NPCFEATS.animations.Spell_item = NPCFEATS.skeletonNPC.getAnimationRange("Spell_item");
        NPCFEATS.animations.Taking_damage = NPCFEATS.skeletonNPC.getAnimationRange("Taking_damage");
        NPCFEATS.animations.Walk = NPCFEATS.skeletonNPC.getAnimationRange("Walk");
        NPCFEATS.animations.Walk_start = NPCFEATS.skeletonNPC.getAnimationRange("Walk_start");
        NPCFEATS.animations.Walk_End = NPCFEATS.skeletonNPC.getAnimationRange("Walk_End");
        scene.beginAnimation(NPCFEATS.skeletonNPC, NPCFEATS.animations.Idle.from, NPCFEATS.animations.Idle.to, true);


        var healthBarMaterial = new BABYLON.StandardMaterial("hb1mat", scene);
        healthBarMaterial.diffuseColor = BABYLON.Color3.Red();
        healthBarMaterial.backFaceCulling = false;

        var healthBarMaterial1 = new BABYLON.StandardMaterial("hb11mat", scene);
        healthBarMaterial1.diffuseColor = BABYLON.Color3.Green();
        healthBarMaterial1.backFaceCulling = false;

        var healthBarContainerMaterial = new BABYLON.StandardMaterial("hb2mat", scene);
        healthBarContainerMaterial.diffuseColor = BABYLON.Color3.Blue();
        healthBarContainerMaterial.backFaceCulling = false;

        NPCFEATS.dynamicTexture1 = new BABYLON.DynamicTexture("dt1", 512, scene, true);
        NPCFEATS.dynamicTexture1.hasAlpha = true;

        var healthBarTextMaterial = new BABYLON.StandardMaterial("hb3mat", scene);
        healthBarTextMaterial.diffuseTexture = NPCFEATS.dynamicTexture1;
        healthBarTextMaterial.backFaceCulling = false;
        healthBarTextMaterial.diffuseColor = BABYLON.Color3.Green();

        NPCFEATS.healthBarContainer = BABYLON.MeshBuilder.CreatePlane("hb2", { width: 3.2, height: .5, subdivisions: 4 }, scene);
        var healthBar = BABYLON.MeshBuilder.CreatePlane("hb1", {width:3.2, height:.5, subdivisions:4}, scene);
        NPCFEATS.healthBarG = BABYLON.MeshBuilder.CreatePlane("hb1G", {width:3.2, height:.5, subdivisions:4, updatable:true }, scene);
        NPCFEATS.healthBarContainer.isPickable = false;
        healthBar.isPickable = false;
        NPCFEATS.healthBarG.isPickable = false;

        var healthBarText = BABYLON.MeshBuilder.CreatePlane("hb3", { width: 2, height: 2, subdivisions: 4 }, scene);
        healthBarText.material = healthBarMaterial;
        healthBarText.isPickable = false;

        NPCFEATS.healthBarContainer.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

        healthBar.renderingGroupId = 1;
        NPCFEATS.healthBarG.renderingGroupId = 1;
        healthBarText.renderingGroupId = 1;
        NPCFEATS.healthBarContainer.renderingGroupId = 1;

        healthBar.position = new BABYLON.Vector3(0, 0, -.01);			// Move in front of container slightly.  Without this there is flickering.
        NPCFEATS.healthBarG.position = new BABYLON.Vector3(0, 0, -.01);
        NPCFEATS.healthBarContainer.position = new BABYLON.Vector3(0, 4, -3);     // Position above player.
        healthBarText.position = new BABYLON.Vector3(2.3, -.4, 0);

        healthBar.parent = NPCFEATS.healthBarContainer;
        NPCFEATS.healthBarG.parent = NPCFEATS.healthBarContainer;
        NPCFEATS.healthBarContainer.parent = NPC;
        healthBarText.parent = NPCFEATS.healthBarContainer;

        healthBar.material = healthBarMaterial;
        NPCFEATS.healthBarG.material = healthBarMaterial1;
        NPCFEATS.healthBarContainer.material = healthBarContainerMaterial;
        healthBarText.material = healthBarTextMaterial;

        NPCFEATS.textureContext1 = NPCFEATS.dynamicTexture1.getContext();
        var size = NPCFEATS.dynamicTexture1.getSize();
        var text = health_npc + "%";

        NPCFEATS.textureContext1.clearRect(0, 0, size.width, size.height);

        NPCFEATS.textureContext1.font = "bold 120px Calibri";
        var textSize = NPCFEATS.textureContext1.measureText(text);
        NPCFEATS.textureContext1.fillStyle = "white";
        NPCFEATS.textureContext1.fillText(text,(size.width - textSize.width) / 2,(size.height - 120) / 2);

        NPCFEATS.dynamicTexture1.update();

      });


        BABYLON.SceneLoader.ImportMesh("", "models/", "Mages_1to4_babylon.babylon", scene, function (newMeshes, particleSystems, skeletons) {

            var magemat = new BABYLON.StandardMaterial("qwewqe", scene);
            magemat.ambientTexture = new BABYLON.Texture("models/MagesTexture.png", scene);

            //player.dispose() ;
            player = newMeshes[4];
            player.position = new BABYLON.Vector3(0, 0.35, 0);
            player.material = magemat;

            let p = newMeshes[2];
            p.parent = player;
            p.material = magemat;

            player.checkCollisions = true;
            player.ellipsoid = new BABYLON.Vector3(0.5, .5, 0.5);
            player.applyGravity = true;

            //player.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
            camera.lockedTarget = player;
            player.checkCollisions=true;
            player.isPickable = false;
            var size = player.getBoundingInfo().boundingBox.extendSize;
            //console.log(size);
            let y = count_angle_rotate();
            _STATE_PLAYER.angle.x = 0;
            _STATE_PLAYER.angle.y = 1;
            //player.addRotation(0,y,0);
            player.rotation.y += y;
            //showLocalAxis(4, player.position);

            newMeshes[0].dispose();
            newMeshes[1].dispose();
            //newMeshes[2].dispose();
            newMeshes[3].dispose();
            //newMeshes[4].dispose();
            newMeshes[5].dispose();
            newMeshes[6].dispose();
            newMeshes[7].dispose();

            PLAYERFEATS.skeletonNPC = skeletons[0];
            // ROBOT
            PLAYERFEATS.skeletonNPC.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
            PLAYERFEATS.skeletonNPC.animationPropertiesOverride.enableBlending = true;
            PLAYERFEATS.skeletonNPC.animationPropertiesOverride.blendingSpeed = 0.05;
            PLAYERFEATS.skeletonNPC.animationPropertiesOverride.loopMode = 1;

            PLAYERFEATS.skeletonNPC.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
            PLAYERFEATS.skeletonNPC.animationPropertiesOverride.enableBlending = true;
            PLAYERFEATS.skeletonNPC.animationPropertiesOverride.blendingSpeed = 0.05;
            PLAYERFEATS.skeletonNPC.animationPropertiesOverride.loopMode = 1;
            // Death_back Death_forward Fly Hit1 Hit2 Idle Spell_item Taking_damage Walk Walk_End Walk_start
            PLAYERFEATS.animations.Death_back = PLAYERFEATS.skeletonNPC.getAnimationRange("Death_back");
            PLAYERFEATS.animations.Death_forward = PLAYERFEATS.skeletonNPC.getAnimationRange("Death_forward");
            PLAYERFEATS.animations.Fly = PLAYERFEATS.skeletonNPC.getAnimationRange("Fly");
            PLAYERFEATS.animations.Hit1 = PLAYERFEATS.skeletonNPC.getAnimationRange("Hit1");
            PLAYERFEATS.animations.Hit2 = PLAYERFEATS.skeletonNPC.getAnimationRange("Hit2");
            PLAYERFEATS.animations.Idle = PLAYERFEATS.skeletonNPC.getAnimationRange("Idle");
            PLAYERFEATS.animations.Spell_item = PLAYERFEATS.skeletonNPC.getAnimationRange("Spell_item");
            PLAYERFEATS.animations.Taking_damage = PLAYERFEATS.skeletonNPC.getAnimationRange("Taking_damage");
            PLAYERFEATS.animations.Walk = PLAYERFEATS.skeletonNPC.getAnimationRange("Walk");
            PLAYERFEATS.animations.Walk_start = PLAYERFEATS.skeletonNPC.getAnimationRange("Walk_start");
            PLAYERFEATS.animations.Walk_End = PLAYERFEATS.skeletonNPC.getAnimationRange("Walk_End");
            scene.beginAnimation(PLAYERFEATS.skeletonNPC, PLAYERFEATS.animations.Idle.from, PLAYERFEATS.animations.Idle.to, true);


            var healthBarMaterial = new BABYLON.StandardMaterial("hb1mat", scene);
            healthBarMaterial.diffuseColor = BABYLON.Color3.Red();
            healthBarMaterial.backFaceCulling = false;

            var healthBarMaterial1 = new BABYLON.StandardMaterial("hb11mat", scene);
            healthBarMaterial1.diffuseColor = BABYLON.Color3.Green();
            healthBarMaterial1.backFaceCulling = false;

            var healthBarContainerMaterial = new BABYLON.StandardMaterial("hb2mat", scene);
            healthBarContainerMaterial.diffuseColor = BABYLON.Color3.Blue();
            healthBarContainerMaterial.backFaceCulling = false;

            PLAYERFEATS.dynamicTexture1 = new BABYLON.DynamicTexture("dt1", 512, scene, true);
            PLAYERFEATS.dynamicTexture1.hasAlpha = true;

            var healthBarTextMaterial = new BABYLON.StandardMaterial("hb3mat", scene);
            healthBarTextMaterial.diffuseTexture = PLAYERFEATS.dynamicTexture1;
            healthBarTextMaterial.backFaceCulling = false;
            healthBarTextMaterial.diffuseColor = BABYLON.Color3.Green();

            PLAYERFEATS.healthBarContainer = BABYLON.MeshBuilder.CreatePlane("hb2", { width: 3.2, height: .5, subdivisions: 4 }, scene);
            var healthBar = BABYLON.MeshBuilder.CreatePlane("hb1", {width:3.2, height:.5, subdivisions:4}, scene);
            PLAYERFEATS.healthBarG = BABYLON.MeshBuilder.CreatePlane("hb1G", {width:3.2, height:.5, subdivisions:4, updatable:true }, scene);
            PLAYERFEATS.healthBarContainer.isPickable = false;
            healthBar.isPickable = false;
            PLAYERFEATS.healthBarG.isPickable = false;

            var healthBarText = BABYLON.MeshBuilder.CreatePlane("hb3", { width: 2, height: 2, subdivisions: 4 }, scene);
            healthBarText.material = healthBarMaterial;
            healthBarText.isPickable = false;

            PLAYERFEATS.healthBarContainer.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

            healthBar.renderingGroupId = 1;
            PLAYERFEATS.healthBarG.renderingGroupId = 1;
            healthBarText.renderingGroupId = 1;
            PLAYERFEATS.healthBarContainer.renderingGroupId = 1;

            healthBar.position = new BABYLON.Vector3(0, 0, -.01);			// Move in front of container slightly.  Without this there is flickering.
            PLAYERFEATS.healthBarG.position = new BABYLON.Vector3(0, 0, -.01);
            PLAYERFEATS.healthBarContainer.position = new BABYLON.Vector3(0, 4, -3);     // Position above player.
            healthBarText.position = new BABYLON.Vector3(2.3, -.4, 0);

            healthBar.parent = PLAYERFEATS.healthBarContainer;
            PLAYERFEATS.healthBarG.parent = PLAYERFEATS.healthBarContainer;
            PLAYERFEATS.healthBarContainer.parent = player;
            healthBarText.parent = PLAYERFEATS.healthBarContainer;

            healthBar.material = healthBarMaterial;
            PLAYERFEATS.healthBarG.material = healthBarMaterial1;
            PLAYERFEATS.healthBarContainer.material = healthBarContainerMaterial;
            healthBarText.material = healthBarTextMaterial;

            PLAYERFEATS.textureContext1 = PLAYERFEATS.dynamicTexture1.getContext();
            var size = PLAYERFEATS.dynamicTexture1.getSize();
            var text = health_npc + "%";

            PLAYERFEATS.textureContext1.clearRect(0, 0, size.width, size.height);

            PLAYERFEATS.textureContext1.font = "bold 120px Calibri";
            var textSize = PLAYERFEATS.textureContext1.measureText(text);
            PLAYERFEATS.textureContext1.fillStyle = "white";
            PLAYERFEATS.textureContext1.fillText(text,(size.width - textSize.width) / 2,(size.height - 120) / 2);

            PLAYERFEATS.dynamicTexture1.update();

        });


      var ICEBALLS = [];
      var ICE_PARTICLES = null;


        function create_ice_ball(x, z, y=2, angle, _FLY_TO, _FLY_FROM) {
            BABYLON.SceneLoader.ImportMesh("", "models/", "Crystal_babylon.babylon", scene, function (newMeshes, particleSystems, skeletons) {
                let main_ice = newMeshes[0];
                let little_ice = newMeshes[1];
                little_ice.setEnabled(false);
                main_ice.scaling = new BABYLON.Vector3(0.2,0.2,0.2);
                main_ice.position = new BABYLON.Vector3(x, y, z);
                //little_ice.position = new BABYLON.Vector3(0, 2.2, 2);
                //little_ice.setParent(main_ice);

                main_ice.material = nodeMaterial;

                main_ice.rotation.y = angle;
                //main_ice.addRotation = (0, angle ,0);

                let t = new BABYLON.ParticleSystem.Parse(ICE_PARTICLES, scene, '');
                //little_ice.material = nodeMaterial;

                var meshEmitter = new BABYLON.MeshParticleEmitter(main_ice);
                meshEmitter.useMeshNormalsForDirection = false;
                meshEmitter.direction1 = new BABYLON.Vector3(0.5, 0, -1);
                meshEmitter.direction2 = new BABYLON.Vector3(-0.5, 0, -1);

                t.particleEmitterType = meshEmitter;
                t.emitter = main_ice;
                ICEBALLS.push({mesh1: main_ice, partsys: t, _fly_to: Object.assign({}, _FLY_TO), _fly_from: Object.assign({}, _FLY_FROM), isShot: false});

                t.start();

            });
        }



        $.getJSON("models/IceSmoke.json", function(data) {
            ICE_PARTICLES = data.systems[0];
        });


      var impMat = new BABYLON.StandardMaterial("impMat", scene);
      impMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
      // Impact impostor
      var impact = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 0, diameterX: _RADIUS*2, diameterY: 0.01, diameterZ: _RADIUS*2, updatable: true}, scene);
      impact.material = impMat;

      var spoint = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 0, diameterX: _RADIUS*2, diameterY: 0.01, diameterZ: _RADIUS*2, updatable: true}, scene);
      //spoint.setEnabled(false);

      var cast_up = BABYLON.Mesh.CreateLines("cast", [
              new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 0)
        ], scene, true);
      cast_up.color = new BABYLON.Color3(0, 1, 0);
     // cast_up.dispose();

     var animationBox1 = new BABYLON.Animation("myAnimation1", "scaling.x", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
     var animationBox2 = new BABYLON.Animation("myAnimation2", "position.x", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        // An array with all animation keys
        var keys1 = [];
        //At the animation key 0, the value of scaling is "0"
          keys1.push({
            frame: 0,
            value: 0
          });
          //At the animation key 100, the value of scaling is "1"
          keys1.push({
            frame: 20,
            value: 1
          });
        // An array with all animation keys
        var keys2 = [];
        //At the animation key 0, the value of scaling is "0"
          keys2.push({
            frame: 0,
            value: 0
          });
          //At the animation key 100, the value of scaling is "1"
          keys2.push({
            frame: 20,
            value: 1
          });


     async function npc_death() {
        let anim = scene.beginAnimation(NPCFEATS.skeletonNPC, NPCFEATS.animations.Death_back.from, NPCFEATS.animations.Death_back.to, false);
        await anim.waitAsync();
        NPC.dispose();
     }
     var greyBar = null;

     function ice_cast_fuck() {

        let h = 3.2;

        let width123 = NPCFEATS.healthBarG.scaling.x * h;
        health_npc = Math.round(((width123-0.9) / h) * 100);

        var gbmat = new BABYLON.StandardMaterial("hb2mat", scene);
        gbmat.diffuseColor = BABYLON.Color3.FromHexString("#ADD8E6");
        gbmat.backFaceCulling = false;

        if (greyBar) greyBar.dispose();

        let W = (health_npc <= 0) ? NPCFEATS.healthBarG.scaling.x * h : 0.8;
        greyBar = BABYLON.MeshBuilder.CreatePlane("hb1234", {width:W, height:.5, subdivisions:4}, scene);
        greyBar.isPickable = false;

        greyBar.renderingGroupId = 1;
        greyBar.position = new BABYLON.Vector3(1.6 + 2 * NPCFEATS.healthBarG.position.x - 0.4, 0, -.01);			// Move in front of container slightly.  Without this there is flickering.
        greyBar.parent = NPCFEATS.healthBarContainer;
        greyBar.material = gbmat;

        keys1[0].value = greyBar.scaling.x;
        keys1[1].value = 0;
        keys2[0].value = greyBar.position.x;
        keys2[1].value = greyBar.position.x - 0.4;

        animationBox1.setKeys(keys1);
        animationBox2.setKeys(keys2);
        greyBar.animations = [];
        greyBar.animations.push(animationBox1);
        greyBar.animations.push(animationBox2);

        scene.beginAnimation(greyBar, 0, 20, false);

//            BABYLON.Animation.CreateAndStartAnimation('boxscale', healthBarG, 'scaling.x', 50, 100, healthBarG.scaling.x, (width123-0.9) / h, false);
//            BABYLON.Animation.CreateAndStartAnimation('boxpos', healthBarG, 'position.x', 50, 100, healthBarG.position.x, healthBarG.position.x - 0.45, false);

        NPCFEATS.healthBarG.position.x -= 0.4;
        NPCFEATS.healthBarG.scaling.x = (width123-0.8) / h;
        var size = NPCFEATS.dynamicTexture1.getSize();
        let HP = (health_npc <= 0) ? 0 : health_npc;
        var text = HP + "%";
        NPCFEATS.textureContext1.clearRect(0, 0, size.width, size.height);
        NPCFEATS.textureContext1.font = "bold 120px Calibri";
        var textSize = NPCFEATS.textureContext1.measureText(text);
        NPCFEATS.textureContext1.fillStyle = "white";
        NPCFEATS.textureContext1.fillText(text,(size.width - textSize.width) / 2,(size.height - 120) / 2);
        NPCFEATS.dynamicTexture1.update();

        if (health_npc <= 0) npc_death();
     }



        //box movement variables
        const V = 0.09;
        let dist = 0;
        let xx = 0, zz = 0;
        const eps = 0.05;
        let k = 0;
        let tmp = 0;
        let newX = 0, newZ = 0;
        let alpha = 90;
        var ATTACK_BALLS = [];
        var timer_attack = null;
        var flag_attack = true;
        var before_attack_time, now_attack_time;
        var  ABi;
        var _FLY_TO = {};
        var ground_change = {g: null, is4: false };

        var rayline = BABYLON.Mesh.CreateLines("cast", [
              new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 0)
          ], scene, true);
        rayline.color = new BABYLON.Color3(0, 1, 0);


        scene.registerBeforeRender(function () {

            if (player) {

                if (NPC_STATE.state != "stand") {

                    NPC_STATE._MOVE_TO.cos = Math.abs(NPC.position.x - xx) / Math.sqrt(Math.pow(NPC.position.z - zz,2)+Math.pow(NPC.position.x - xx,2));
                    NPC_STATE._MOVE_TO.sin = Math.abs(NPC.position.z - zz) / Math.sqrt(Math.pow(NPC.position.z - zz,2)+Math.pow(NPC.position.x - xx,2));
                    NPC_STATE._MOVE_TO.direction = new BABYLON.Vector2((xx - NPC.position.x >=0)?1:-1, (zz - NPC.position.z >=0)?1:-1);

                    dist = Math.sqrt(Math.pow(NPC.position.x - xx, 2) + Math.pow(NPC.position.z - zz, 2));

                    newX = NPC_STATE._MOVE_TO.direction.x * NPC_STATE._MOVE_TO.cos * V * 0.5;
                    newZ = NPC_STATE._MOVE_TO.direction.y * NPC_STATE._MOVE_TO.sin * V * 0.5;
                    var forward = new BABYLON.Vector3(newX, -0.01, newZ);
//                    if(meshFound.distance > 0.55){
//                        forward.y = -0.05;
//                    }
//                    if(meshFound.distance > 1){
//                        forward.y = -0.8;
//                    }
                    NPC.moveWithCollisions(forward);

                    if (dist < eps) {
                        NPC_STATE.state = "stand";
                        scene.beginAnimation(NPCFEATS.skeletonNPC, NPCFEATS.animations.Idle.from, NPCFEATS.animations.Idle.to, true);
                    }

                }


                xx = player.position.x;
                zz = player.position.z;

                if (_STATE_ATTACK.is_attack_ready) {
                    dist = Math.sqrt(Math.pow(PLAYER_STATE._MOVE_TO.x - xx, 2) + Math.pow(PLAYER_STATE._MOVE_TO.z - zz, 2));
                    if (dist < 9) {
                        PLAYER_STATE._MOVE_TO.isquest = false;
                        if (flag_attack) { before_attack_time = Date.now(); flag_attack = false; }
                        else {
                            now_attack_time = Date.now();
                            if (now_attack_time - before_attack_time > 700) {
                                r1 = new BABYLON.Vector2(0,1);
                                r2 = new BABYLON.Vector2(PLAYER_STATE._FLY_TO.x - xx, PLAYER_STATE._FLY_TO.z - zz);
                                let angle = count_angle_rotate(r1, r2);

                                let _FLY_FROM = {};
                                //console.log(xx, NPCFEATS.staff.position.x);
                                _FLY_FROM.x = xx + _STATE_PLAYER.angle.x;
                                _FLY_FROM.z = zz + _STATE_PLAYER.angle.y;
                                PLAYER_STATE._FLY_TO.cos = Math.abs(PLAYER_STATE._FLY_TO.x - xx) / Math.sqrt(Math.pow(PLAYER_STATE._FLY_TO.z - zz,2)+Math.pow(PLAYER_STATE._FLY_TO.x - xx,2));
                                PLAYER_STATE._FLY_TO.sin = Math.abs(PLAYER_STATE._FLY_TO.z - zz) / Math.sqrt(Math.pow(PLAYER_STATE._FLY_TO.z - zz,2)+Math.pow(PLAYER_STATE._FLY_TO.x - xx,2));
                                PLAYER_STATE._FLY_TO.direction = new BABYLON.Vector2((PLAYER_STATE._FLY_TO.x - xx >=0)?1:-1, (PLAYER_STATE._FLY_TO.z - zz >=0)?1:-1);

                                create_ice_ball(xx+_STATE_PLAYER.angle.x*2, zz+_STATE_PLAYER.angle.y*2, 1.5, angle, PLAYER_STATE._FLY_TO, _FLY_FROM);
                                flag_attack = true;
                                _STATE_ATTACK.is_attack_repaire = false;
                                _STATE_ATTACK.is_attack_ready = false;

//                                var cast_up = BABYLON.Mesh.CreateLines("cast", [
//                                      new BABYLON.Vector3(_FLY_FROM.x-0.35, 0, _FLY_FROM.z-0.35), new BABYLON.Vector3(_FLY_TO.x-0.35, 0, _FLY_TO.z-0.35)
//                                  ], scene, true);
//                                cast_up.color = new BABYLON.Color3(0, 1, 0);
//                                var cast_up = BABYLON.Mesh.CreateLines("cast", [
//                                      new BABYLON.Vector3(_FLY_FROM.x+0.35, 0, _FLY_FROM.z+0.35), new BABYLON.Vector3(_FLY_TO.x+0.35, 0, _FLY_TO.z+0.35)
//                                  ], scene, true);
//                                cast_up.color = new BABYLON.Color3(0, 1, 0);

                            }
                        }
                    }
                    else flag_attack = true;
                }
                else flag_attack = true;


                divFps.innerHTML = engine.getFps().toFixed() + " fps";

                for (let index = ICEBALLS.length - 1; index >= 0; index -= 1) {
                    let cast = ICEBALLS[index];
                    newX = cast._fly_to.direction.x * V * cast._fly_to.cos;
                    newZ = cast._fly_to.direction.y * V * cast._fly_to.sin;

                    cast.mesh1.position.x += newX;
                    cast.mesh1.position.z += newZ;
                    if (cast.mesh1.intersectsMesh(NPC)&&!cast.isShot) { cast.isShot = true; ice_cast_fuck(); }
                    let dist = Math.sqrt(Math.pow(cast._fly_from.x - cast.mesh1.position.x, 2) + Math.pow(cast._fly_from.z - cast.mesh1.position.z, 2));
                    if (dist > 10) { cast.partsys.stop(); cast.mesh1.dispose(); ICEBALLS.splice(index, 1); }
                }


                if (PLAYER_STATE._MOVE_TO.isquest) {
                    xx = player.position.x;
                    zz = player.position.z;

                    var rayPick = new BABYLON.Ray(player.position, new BABYLON.Vector3(0, -1, 0));
                    var meshFound = scene.pickWithRay(rayPick, function (item) {
                        if (ground_change.g != item) {ground_change.g = item; ground_change.is4 = true; }
                        return grounds.includes(item);
                    });

                    let DIST_WITH_NPC = Math.sqrt(Math.pow(NPC.position.x - xx, 2) + Math.pow(NPC.position.z - zz, 2));
                    if ((DIST_WITH_NPC <= 5)&&(NPC_STATE.state == "stand")) {
                        NPC_STATE.state = "run_follow";
                        scene.beginAnimation(NPCFEATS.skeletonNPC, NPCFEATS.animations.Walk.from, NPCFEATS.animations.Walk.to, true);
                    }


                    if (ground_change.is4) {
                        PLAYER_STATE._MOVE_TO.cos = Math.abs(PLAYER_STATE._MOVE_TO.x - xx) / Math.sqrt(Math.pow(PLAYER_STATE._MOVE_TO.z - zz,2)+Math.pow(PLAYER_STATE._MOVE_TO.x - xx,2));
                        PLAYER_STATE._MOVE_TO.sin = Math.abs(PLAYER_STATE._MOVE_TO.z - zz) / Math.sqrt(Math.pow(PLAYER_STATE._MOVE_TO.z - zz,2)+Math.pow(PLAYER_STATE._MOVE_TO.x - xx,2));
                        PLAYER_STATE._MOVE_TO.direction = new BABYLON.Vector2((PLAYER_STATE._MOVE_TO.x - xx >=0)?1:-1, (PLAYER_STATE._MOVE_TO.z - zz >=0)?1:-1);
                    }

                    dist = Math.sqrt(Math.pow(PLAYER_STATE._MOVE_TO.x - xx, 2) + Math.pow(PLAYER_STATE._MOVE_TO.z - zz, 2));

                    //console.log(PLAYER_STATE._MOVE_TO.direction.x, Math.round(PLAYER_STATE._MOVE_TO.cos * 100) / 100, 
                    //            PLAYER_STATE._MOVE_TO.direction.y, Math.round(PLAYER_STATE._MOVE_TO.sin * 100) / 100, V);

                  
                    //socket.onmessage = function(event) {
                    if (BUF_GO.length != 0) {
                        //alert(`[message] Данные получены с сервера: ${event.data}`);
                        //console.log(BUF_GO[BUF_GO.length - 1]);

                        newX = BUF_GO[BUF_GO.length - 1][0];
                        newZ = BUF_GO[BUF_GO.length - 1][1];
                        BUF_GO.length = 0;
                        //let ar = event.data.split(" ");
                        //newX = parseFloat(ar[0]);
                        //newZ = parseFloat(ar[1]);
                        //newX = PLAYER_STATE._MOVE_TO.direction.x * PLAYER_STATE._MOVE_TO.cos * V;
                        //newZ = PLAYER_STATE._MOVE_TO.direction.y * PLAYER_STATE._MOVE_TO.sin * V;
                        //var forward = new BABYLON.Vector3(newX, -0.01, newZ);
                        //if(meshFound.distance > 0.55){
                        //    forward.y = -0.05;
                        //}
                        //if(meshFound.distance > 1){
                        //    forward.y = -0.8;
                        //}
                        //player.moveWithCollisions(forward);
                        player.position.x = newX;
                        player.position.z = newZ;

                        if (dist < eps) {
                            //console.log(player.position);
                            PLAYER_STATE._MOVE_TO.isquest = false;
                            scene.beginAnimation(PLAYERFEATS.skeletonNPC, PLAYERFEATS.animations.Idle.from, PLAYERFEATS.animations.Idle.to, true);
                        }
                    }
                    
                }
            }
        });

        canvas.addEventListener("keydown", e=>{
            if((e.key === "q") || (e.key === "Q") || (e.key === "й")) {
                _STATE_ATTACK.is_attack_repaire = true;
                canvas.addEventListener("mousemove", apply_iceball_direction);
            }
        });


        // Pick mesh by clicking the canvas
        //canvas.addEventListener('click', () => {
//          // We try to pick an object
//          const result = scene.pick(scene.pointerX, scene.pointerY);
//          //var result = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == NPC; });
//          let pickedMesh;
//          // console.log(highlight)
//
//          // First remove hightlighted meshes
//          //if (highlight.hasMesh(sphere)) {
//            highlight.removeMesh(NPC);
//          //}
//          //if (highlight.hasMesh(ground)) {
//            //highlight.removeMesh(ground);
//          //}
//
//          // Then if a mesh is hit, highlight it
//          //if (result.hit && (result.pickedMesh.name=='Knight')) {
//          if (result.hit) {
//            if (result.pickedMesh.name=='Knight') {
//                // Then highlight the hit mesh
//                console.log(result.pickedMesh.name);
//                highlight.addMesh(result.pickedMesh, BABYLON.Color3.White());
//                pickedMesh = result.pickedMesh;
//                NPC_IS_PICKED = true;
//            }
//            else { NPC_IS_PICKED = false; }
//          }
        //});

//        scene.onKeyboardObservable.add((kbInfo) => {
//            switch (kbInfo.type) {
//                case BABYLON.KeyboardEventTypes.KEYDOWN:
//                    console.log("KEY DOWN: ", kbInfo.event.keyCode);
//                    break;
//                case BABYLON.KeyboardEventTypes.KEYUP:
//                    console.log("KEY UP: ", kbInfo.event.keyCode);
//                    break;
//            }
//        });

        function apply_iceball_direction(ev) {
            const result = scene.pick(scene.pointerX, scene.pointerY);
            cast_up = BABYLON.Mesh.CreateLines("cast", [
                new BABYLON.Vector3(player.position.x, 0, player.position.z), new BABYLON.Vector3(result.pickedPoint.x, 0, result.pickedPoint.z)
            ], null, null, cast_up);
        }

        var animationBoxR = new BABYLON.Animation("myAnimation1", "rotation.y", 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        // An array with all animation keys
        var keysR = [];
        //At the animation key 0, the value of scaling is "0"
          keysR.push({
            frame: 0,
            value: 0
          });
          //At the animation key 100, the value of scaling is "1"
          keysR.push({
            frame: 4,
            value: 1
          });

        async function rotate_player(pickResult, doing) {
            r1 = _STATE_PLAYER.angle;
            r2 = new BABYLON.Vector2(pickResult.pickedPoint.x - player.position.x, pickResult.pickedPoint.z - player.position.z);
            y = count_angle_rotate(r1, r2) ;
            _STATE_PLAYER.angle.x = r2.x / Math.sqrt(r2.x*r2.x + r2.y*r2.y);
            _STATE_PLAYER.angle.y = r2.y / Math.sqrt(r2.x*r2.x + r2.y*r2.y);
            //player.addRotation(0, y ,0);
            //player.rotation.y += y;
            //player.rotate(BABYLON.Axis.Y, y, BABYLON.Space.WORLD);
            keysR[0].value = player.rotation.y;
            keysR[1].value = player.rotation.y + y;

            animationBoxR.setKeys(keysR);
            player.animations = [];
            player.animations.push(animationBoxR);

            let anim = scene.beginDirectAnimation(player, [animationBoxR], 0, 4, false);
            //return 0;
            await anim.waitAsync();
            if (doing=="go") PLAYER_STATE._MOVE_TO.isquest = true; //: _STATE_ATTACK.is_attack_ready = true;
        }

        let r1 = 0, r2 = 0, y = 0;
        //When pointer down event is raised
        scene.onPointerDown = function (evt, pickResult) {

          const result = scene.pick(scene.pointerX, scene.pointerY);
          let pickedMesh;
          highlight.removeMesh(NPC);

            // if the click hits the ground object, we change the impact position
            if (pickResult.hit) {

                //console.log(player.destination);

                if (_STATE_ATTACK.is_attack_repaire) {
                    rotate_player(pickResult, doing="attack");
                    setTimeout(async () => {
                        //PLAYER_STATE._MOVE_TO.isquest = false;
                        _STATE_ATTACK.is_attack_ready = true;
                        _STATE_ATTACK.is_attack_repaire = false;
                        let anim = scene.beginAnimation(PLAYERFEATS.skeletonNPC, PLAYERFEATS.animations.Hit1.from, PLAYERFEATS.animations.Hit1.to, false, 0.8);
                        anim.onAnimationEnd = () => {
                             if (!PLAYER_STATE._MOVE_TO.isquest) scene.beginAnimation(PLAYERFEATS.skeletonNPC, PLAYERFEATS.animations.Idle.from, PLAYERFEATS.animations.Idle.to, true);
                        }
                        //await anim.waitAsync();
                        //let anim1 = scene.beginAnimation(PLAYERFEATS.skeletonNPC, PLAYERFEATS.animations.Hit1.from+17, PLAYERFEATS.animations.Hit1.to, false, 1);
                        //await anim.waitAsync();
                        //if (PLAYER_STATE._MOVE_TO.isquest) scene.beginAnimation(PLAYERFEATS.skeletonNPC, PLAYERFEATS.animations.Idle.from, PLAYERFEATS.animations.Idle.to, true);
                    }, 100);
                    canvas.removeEventListener("mousemove", apply_iceball_direction);

                    cast_up = BABYLON.Mesh.CreateLines("cast", [
                        new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 0)
                    ], null, null, cast_up);
                    //_STATE_ATTACK.is_attack_ready = true;
                    //let PLAYER_STATE._FLY_TO = {};
                    PLAYER_STATE._FLY_TO.x = pickResult.pickedPoint.x;
                    PLAYER_STATE._FLY_TO.z = pickResult.pickedPoint.z;
                }

                else {

                    _STATE_ATTACK.is_attack_repaire = false;
                    _STATE_ATTACK.is_attack_ready = false;

                    if (result.pickedMesh == NPC) {
                        // Then highlight the hit mesh
                        highlight.addMesh(result.pickedMesh, BABYLON.Color3.White());
                        pickedMesh = result.pickedMesh;
                        NPC_IS_PICKED = true;
                    }
                    else { NPC_IS_PICKED = false; }

                    impact.position.x = pickResult.pickedPoint.x;
                    impact.position.z = pickResult.pickedPoint.z;
                    impact.position.y = pickResult.pickedPoint.y;

                    rotate_player(pickResult, doing="go");
//                    setTimeout(async () => {
//                        let anim = rotate_player(pickResult, doing="go");
//                        await anim.waitAsync();
//                        PLAYER_STATE._MOVE_TO.isquest = true;
//                    });
                    if (!_MOVE_TO.isquest) scene.beginAnimation(PLAYERFEATS.skeletonNPC, PLAYERFEATS.animations.Walk.from, PLAYERFEATS.animations.Walk.to, true);
                    {
                        var rayPick = new BABYLON.Ray(player.position, new BABYLON.Vector3(0, -1, 0));
                        var meshFound = scene.pickWithRay(rayPick, function (item) {
                            ground_change.g = item; ground_change.is4 = false;
                            return grounds.includes(item);
                        });
                        xx = player.position.x;
                        zz = player.position.z;

                        PLAYER_STATE._MOVE_TO.x = pickResult.pickedPoint.x;
                        PLAYER_STATE._MOVE_TO.z = pickResult.pickedPoint.z;
                        PLAYER_STATE._MOVE_TO.cos = Math.abs(PLAYER_STATE._MOVE_TO.x - xx) / Math.sqrt(Math.pow(PLAYER_STATE._MOVE_TO.z - zz,2)+Math.pow(PLAYER_STATE._MOVE_TO.x - xx,2));
                        PLAYER_STATE._MOVE_TO.sin = Math.abs(PLAYER_STATE._MOVE_TO.z - zz) / Math.sqrt(Math.pow(PLAYER_STATE._MOVE_TO.z - zz,2)+Math.pow(PLAYER_STATE._MOVE_TO.x - xx,2));
                        PLAYER_STATE._MOVE_TO.direction = new BABYLON.Vector2((PLAYER_STATE._MOVE_TO.x - xx >=0)?1:-1, (PLAYER_STATE._MOVE_TO.z - zz >=0)?1:-1);

                        BUF_GO.length = 0;

                        let msg = (Math.round(xx * 1000) / 1000).toString() + ' ' + (Math.round(zz * 1000) / 1000) + ' ' +
                                  PLAYER_STATE._MOVE_TO.direction.x + ' ' + Math.round(PLAYER_STATE._MOVE_TO.cos * 1000) / 1000 + ' ' +
                                  PLAYER_STATE._MOVE_TO.direction.y + ' ' + Math.round(PLAYER_STATE._MOVE_TO.sin * 1000) / 1000 + ' ' +
                                  Math.round(PLAYER_STATE._MOVE_TO.x * 1000) / 1000 + ' ' + Math.round(PLAYER_STATE._MOVE_TO.z * 1000) / 1000;
                        // from[2] + direct_cos_sin[4] + to[2] = 8 numbers
                        socket.send(msg);

                        console.log(msg);

                    }
                }
            }
        };


        // UI
        var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        var UiPanel = new BABYLON.GUI.StackPanel();
        UiPanel.isVertical = false;
        UiPanel.left = "150px";
        UiPanel.top = "200px";
        UiPanel.height = "70px";
        UiPanel.fontSize = "14px";
        UiPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        UiPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        advancedTexture.addControl(UiPanel);
        // ..
        var button = BABYLON.GUI.Button.CreateSimpleButton("but1", "Ice Ball");
        //button.paddingTop = "10px";
        button.paddingRight = "10px";
        //button.left = "400px";
        button.width = "70px";
        button.height = "70px";
        //button.color = "white";
        //button.background = "green";
        //button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        button.onPointerDownObservable.add(()=> {
            _STATE_ATTACK.is_attack_repaire = true;
            canvas.addEventListener("mousemove", apply_iceball_direction);
        });
        UiPanel.addControl(button);
        // ..
        var button1 = BABYLON.GUI.Button.CreateSimpleButton("but2", "Fire Ball");
        //button1.paddingTop = "10px";
        button.paddingRight = "10px";
        //button.left = "400px";
        button1.width = "70px";
        button1.height = "70px";
        //button1.color = "white";
        //button1.background = "green";
        //button1.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        button1.onPointerDownObservable.add(()=> {
            //if (walkRange) scene.beginAnimation(skeleton, walkRange.from, walkRange.to, true);
        });
        UiPanel.addControl(button1);
        // ..

        //addDragAndDropFunctionality(ground, camera, scene);

    return scene;
};
/******* End of the create scene function ******/

var scene = createScene(); //Call the createScene function



// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
        scene.render();
});

// Watch for browser/canvas resize events
//window.addEventListener("resize", function () {
//        engine.resize();
//});


//function addDragAndDropFunctionality(ground, camera, scene) {
//    var startingPoint;
//    var currentMesh;
//
//	console.log(scene);
//
////    var getGroundPosition = function () {
////        // Use a predicate to get position on the ground
////        var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == ground; });
////        if (pickinfo.hit) {
////			console.log("hit");
////            return pickinfo.pickedPoint;
////        }
////
////        return null;
////    }
//
//    var onPointerDown = function (evt) {
//        if (evt.button !== 0) {
//            return;
//        }
//
//        // check if we are under a mesh
//        var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == ground; });
//        if (pickInfo.hit) {
//            currentMesh = pickInfo.pickedMesh;
//            //startingPoint = getGroundPosition(evt);
//
//            if (startingPoint) { // we need to disconnect camera from canvas
//                setTimeout(function () {
//                    camera.detachControl(canvas);
//                }, 0);
//            }
//        }
//    };
//
//    var onPointerUp = function () {
//        if (startingPoint) {
//            camera.attachControl(canvas, true);
//            startingPoint = null;
//        }
//    };
//
////    var onPointerMove = function (evt) {
////        if (!startingPoint) {
////            return;
////        }
////
////        //var current = getGroundPosition(evt);
////
////        if (!current) {
////            return;
////        }
////
////        var diff = current.subtract(startingPoint);
////        currentMesh.position.addInPlace(diff);
////
////        startingPoint = current;
////
////    };
//
//    canvas.addEventListener("pointerdown", onPointerDown, false);
//    canvas.addEventListener("pointerup", onPointerUp, false);
//    //canvas.addEventListener("pointermove", onPointerMove, false);
//
//    scene.onDispose = function () {
//        canvas.removeEventListener("pointerdown", onPointerDown);
//        canvas.removeEventListener("pointerup", onPointerUp);
//        //canvas.removeEventListener("pointermove", onPointerMove);
//    };
//
//}