import React, { useState, useEffect, useRef } from "react";
import {
  Avatar,
  Space,
  Button,
  Tooltip,
  Modal,
  Form,
  Input,
  message,
  Empty,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  PlusCircleOutlined,
  CommentOutlined,
  LogoutOutlined,
  SendOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import firebase, { firestore } from "../utils/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  getDocs,
  serverTimestamp,
  onSnapshot,
  where,
  orderBy,
} from "firebase/firestore";
import sty from "./Home.module.css";

const Home = () => {
  const chatRef = useRef();
  const navigate = useNavigate();
  const [userinfo, setUserinfo] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [msg, setMsg] = useState("");
  const [roomList, setRoomList] = useState([]);
  const [curRoom, setCurRoom] = useState(null);
  const curRoomRef = useRef(null);
  useEffect(() => {
    curRoomRef.current = curRoom;
  }, [curRoom]);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [addRoomform] = Form.useForm();
  const [addUserform] = Form.useForm();
  const [joinRoomform] = Form.useForm();
  const handleLogout = () => {
    navigate("/login");
    window.sessionStorage.removeItem("userinfo");
  };

  useEffect(() => {
    if (!window.sessionStorage.userinfo) {
      navigate("/login");
    } else {
      setUserinfo(JSON.parse(window.sessionStorage.userinfo));
    }
  }, []);

  const getRandomDarkColor = () => {
    const r = Math.floor(Math.random() * 128);
    const g = Math.floor(Math.random() * 128);
    const b = Math.floor(Math.random() * 128);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const generateTimestampBasedRoomId = () => {
    const timestamp = new Date().getTime();
    const roomId = timestamp.toString().slice(-4);
    return roomId;
  };

  const init = async () => {
    const q = query(
      collection(firestore, "rooms"),
      where("type", "==", "public"),
      where("name", "==", "public chatroom")
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      let roomBgColor = getRandomDarkColor();
      let roomNumber = generateTimestampBasedRoomId();
      await addDoc(collection(firestore, "rooms"), {
        roomBgColor,
        roomNumber,
        name: "public chatroom",
        type: "public",
      });
    }
  };

  const getMyRooms = async () => {
    const q1 = query(
      collection(firestore, "rooms"),
      where("type", "==", "public")
    );

    const q2 = query(
      collection(firestore, "rooms"),
      where("userId", "==", userinfo?.id)
    );

    const querySnapshot1 = await getDocs(q1);
    const querySnapshot2 = await getDocs(q2);

    let rooms = [];

    querySnapshot1.forEach((d) => {
      const item = {
        ...d.data(),
        id: d.id,
      };
      rooms.push(item);
    });

    querySnapshot2.forEach((d) => {
      const item = {
        ...d.data(),
        id: d.id,
      };
      rooms.push(item);
    });
    if (!curRoomRef.current && rooms.length) {
      setCurRoom(rooms[0]);
    }
    // console.log("聊天室列表 = ", rooms);
    setRoomList(rooms);
  };

  useEffect(() => {
    if (userinfo) {
      onSnapshot(collection(firestore, "rooms"), (snapshot) => {
        getMyRooms();
      });
    }
  }, [userinfo]);

  const getChatList = async () => {
    const q1 = query(
      collection(firestore, "chats"),
      where("roomNumber", "==", curRoomRef.current.roomNumber),
      orderBy("createdAt", "asc")
    );
    const querySnapshot1 = await getDocs(q1);

    let listData = [];

    querySnapshot1.forEach((d) => {
      const item = {
        ...d.data(),
        id: d.id,
      };
      listData.push(item);
    });
    console.log("聊天列表 = ", listData);
    setChatList(listData);
  };

  useEffect(() => {
    if (chatList.length) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatList]);

  useEffect(() => {
    if (userinfo && curRoom) {
      onSnapshot(collection(firestore, "chats"), (snapshot) => {
        getChatList();
      });
    }
  }, [userinfo, curRoom]);

  const handleOpenAddRoom = () => {
    setShowAddRoom(true);
  };
  const handleAddRoom = async (values) => {
    const { roomName } = values;
    let roomBgColor = getRandomDarkColor();
    let roomNumber = generateTimestampBasedRoomId();
    const resData = await addDoc(collection(firestore, "rooms"), {
      userId: userinfo?.id,
      roomBgColor,
      roomNumber,
      name: roomName,
      type: "private",
    });
    setCurRoom({
      id: resData.id,
      userId: userinfo?.id,
      roomBgColor,
      roomNumber,
      name: roomName,
      type: "private",
    });
    setShowAddRoom(false);
    message.success("create success！");
  };

  const handleJoinRoom = async (values) => {
    let { roomNumber } = values;
    const q = query(
      collection(firestore, "rooms"),
      where("roomNumber", "==", roomNumber)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      message.error("Room number not exist!");
      return;
    }
    let joinRoomItem = null;
    querySnapshot.forEach((d) => {
      const item = {
        ...d.data(),
        id: d.id,
      };
      joinRoomItem = item;
    });
    if (joinRoomItem.type == "public") {
      message.error("already join it！");
      return;
    }
    const q2 = query(
      collection(firestore, "rooms"),
      where("roomNumber", "==", roomNumber),
      where("userId", "==", userinfo?.id)
    );
    const querySnapshot2 = await getDocs(q2);
    if (querySnapshot2.empty) {
      await addDoc(collection(firestore, "rooms"), {
        userId: userinfo?.id,
        roomBgColor: joinRoomItem.roomBgColor,
        roomNumber: joinRoomItem.roomNumber,
        name: joinRoomItem.name,
        type: joinRoomItem.type,
      });
      await addDoc(collection(firestore, "chats"), {
        type: 2,
        msg: `${userinfo.nickname}Enter room`,
        roomNumber: joinRoomItem.roomNumber,
        createdAt: serverTimestamp(),
      });
      handleGoogleNotification(`${userinfo.nickname}join${joinRoomItem.name}`);
      setCurRoom({
        userId: userinfo?.id,
        roomBgColor: joinRoomItem.roomBgColor,
        roomNumber: joinRoomItem.roomNumber,
        name: joinRoomItem.name,
        type: joinRoomItem.type,
      });
      message.success("join success！");
      setShowJoinRoom(false);
    } else {
      message.error("already join it！");
    }
  };
  const handleOpenJoinRoom = () => {
    setShowJoinRoom(true);
  };
  useEffect(() => {
    if (showJoinRoom) {
      joinRoomform.setFieldsValue({
        roomNumber: "",
      });
    }
  }, [showJoinRoom]);

  const handleAddUser = async (values) => {
    const { email } = values;
    const q = query(
      collection(firestore, "users"),
      where("email", "==", email)
    );
    const querySnapshot = await getDocs(q);
    let userItem = null;
    if (querySnapshot.empty) {
      message.error("email doesn't exist！");
      return;
    } else {
      querySnapshot.forEach((d) => {
        const item = {
          ...d.data(),
          id: d.id,
        };
        userItem = item;
      });
    }
    const q2 = query(
      collection(firestore, "rooms"),
      where("userId", "==", userItem.id),
      where("roomNumber", "==", curRoom.roomNumber)
    );
    const querySnapshot2 = await getDocs(q2);
    if (querySnapshot2.empty) {
      await addDoc(collection(firestore, "rooms"), {
        userId: userItem.id,
        roomBgColor: curRoom.roomBgColor,
        roomNumber: curRoom.roomNumber,
        name: curRoom.name,
        type: curRoom.type,
      });
      await addDoc(collection(firestore, "chats"), {
        type: 2,
        msg: `${userItem.nickname}加入聊天室`,
        roomNumber: curRoom.roomNumber,
        createdAt: serverTimestamp(),
      });
      handleGoogleNotification(`${userItem.nickname}join${curRoom.name}`);
      message.success("join success！");
      setShowAddUser(false);
    } else {
      message.error("already join it！");
    }
  };

  const handleOpenAddUser = () => {
    setShowAddUser(true);
  };

  useEffect(() => {
    if (showAddUser) {
      addUserform.setFieldsValue({
        email: "",
      });
    }
  }, [showAddUser]);

  useEffect(() => {
    if (showAddRoom) {
      addRoomform.setFieldsValue({
        roomName: `${userinfo?.nickname}Chatroom`,
      });
    }
  }, [showAddRoom]);

  useEffect(() => {
    if (userinfo) {
      init();
    }
  }, [userinfo]);

  const escapeHTML = (text) => {
    return text.replace(/[&<"']/g, function (match) {
      switch (match) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#039;";
      }
    });
  };

  const handleSend = async () => {
    let extra = {};
    if (userinfo.photoURL) {
      extra.photoURL = userinfo.photoURL;
    }
    if (userinfo.avatarBgColor) {
      extra.avatarBgColor = userinfo.avatarBgColor;
    }
    await addDoc(collection(firestore, "chats"), {
      type: 1,
      msg: escapeHTML(msg),
      nickname: userinfo.nickname,
      userId: userinfo.id,
      roomNumber: curRoom.roomNumber,
      ...extra,
      createdAt: serverTimestamp(),
    });
    setMsg("");
    message.success("send success！");
  };

  const handleGoogleNotification = (msg) => {
    // 检查浏览器是否支持 Web Notification API
    if ("Notification" in window) {
      // 请求用户授权显示通知
      Notification.requestPermission().then(function (permission) {
        if (permission === "granted") {
          // 用户授权，可以发送通知了
          new Notification("新消息", {
            body: escapeHTML(msg)
          });
        }
      });
    }
  };

  return (
    <div className={sty.box}>
      <Modal
        title="加入聊天室"
        open={showJoinRoom}
        cancelText="取消"
        okText="確定"
        onOk={() => {
          joinRoomform.submit();
        }}
        onCancel={() => {
          setShowJoinRoom(false);
        }}
      >
        <Form
          form={joinRoomform}
          name="basic"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          onFinish={handleJoinRoom}
          autoComplete="off"
        >
          <Form.Item
            label="聊天室編號"
            name="roomNumber"
            rules={[{ required: true, message: "輸入想加入的聊天室編號!" }]}
          >
            <Input placeholder="輸入聊天室編號" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="新建聊天室"
        open={showAddRoom}
        cancelText="取消"
        okText="確定"
        onOk={() => {
          addRoomform.submit();
        }}
        onCancel={() => {
          setShowAddRoom(false);
        }}
      >
        <Form
          form={addRoomform}
          name="basic"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          onFinish={handleAddRoom}
          autoComplete="off"
        >
          <Form.Item
            label="聊天室名稱"
            name="roomName"
            rules={[{ required: true, message: "輸入聊天室名稱" }]}
          >
            <Input placeholder="輸入聊天室名稱" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="加入用戶"
        open={showAddUser}
        cancelText="取消"
        okText="確定"
        onOk={() => {
          addUserform.submit();
        }}
        onCancel={() => {
          setShowAddUser(false);
        }}
      >
        <Form
          form={addUserform}
          name="basic"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          onFinish={handleAddUser}
          autoComplete="off"
        >
          <Form.Item
            label="用戶email"
            name="email"
            rules={[{ required: true, message: "輸入用戶email" }]}
          >
            <Input placeholder="輸入用戶email" />
          </Form.Item>
        </Form>
      </Modal>
      <div className={sty.left}>
        <div className={sty.userBox}>
          <Avatar
            style={{
              backgroundColor: userinfo?.avatarBgColor,
            }}
            src={userinfo?.photoURL}
            size={50}
          >
            {userinfo?.nickname}
          </Avatar>
          <div className={sty.userMetaBox}>
            <h3>{userinfo?.nickname}</h3>
            <div>{userinfo?.email}</div>
          </div>
        </div>
        <div className={sty.channelBox}>
          {roomList.map((v) => {
            return (
              <div
                onClick={() => {
                  if (v.roomNumber != curRoom.roomNumber) {
                    setCurRoom(v);
                  }
                }}
                key={v.id}
                className={
                  v.roomNumber == curRoom?.roomNumber
                    ? `${sty.channelItem} ${sty.channelItemActive}`
                    : sty.channelItem
                }
              >
                <Avatar
                  size={50}
                  style={{
                    backgroundColor: v.roomBgColor,
                  }}
                ></Avatar>
                <h4>{v.name}</h4>
              </div>
            );
          })}
        </div>
        <div className={sty.optBox}>
          <div onClick={handleOpenAddRoom} className={sty.optItem}>
            <PlusCircleOutlined />
            <span>新增</span>
          </div>
          <div onClick={handleOpenJoinRoom} className={sty.optItem}>
            <CommentOutlined />
            <span>加入</span>
          </div>
          <div onClick={handleLogout} className={sty.optItem}>
            <LogoutOutlined />
            <span>登出</span>
          </div>
        </div>
      </div>
      <div className={sty.right}>
        <div className={sty.channelDetail}>
          {curRoom && (
            <div className={sty.channelDetailLeft}>
              <Avatar
                size={50}
                style={{
                  backgroundColor: curRoom?.roomBgColor,
                }}
              ></Avatar>
              <h4>{curRoom?.name}</h4>
              <span>#{curRoom?.roomNumber}</span>
            </div>
          )}
          {curRoom && curRoom?.type !== "public" && (
            <Tooltip title="添加用戶">
              <Button
                onClick={handleOpenAddUser}
                shape="circle"
                type="primary"
                icon={
                  <UserAddOutlined
                    style={{
                      color: "white",
                    }}
                  />
                }
              />
            </Tooltip>
          )}
        </div>
        <div ref={chatRef} className={sty.chatBox}>
          
          {chatList.map((v) => {
            if (v.type == 1) {
              if (v.userId != userinfo?.id) {
                return (
                  <div className={sty.chatItemL}>
                    <Avatar
                      size={50}
                      src={v.photoURL}
                      style={{
                        backgroundColor: v.avatarBgColor,
                      }}
                    >
                      {v.nickname}
                    </Avatar>
                    <div className={sty.userMetaBox}>
                      <h3> {v.nickname}</h3>
                      <div className={sty.chatTxt}>{v.msg}</div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className={sty.chatItemR}>
                    <div className={sty.userMetaBox}>
                      <h3> {v.nickname}</h3>
                      <div className={sty.chatTxt}>{v.msg}</div>
                    </div>
                    <Avatar
                      size={50}
                      src={v.photoURL}
                      style={{
                        backgroundColor: v.avatarBgColor,
                      }}
                    >
                      {v.nickname}
                    </Avatar>
                  </div>
                );
              }
            } else {
              return (
                <div className={sty.chatItemM}>
                  <div className={sty.chatItemMTxt}>{v.msg}</div>
                </div>
              );
            }
          })}
        </div>
        <div className={sty.chatPublicBox}>
          <Space.Compact
            style={{
              width: "95%",
            }}
          >
            <Input
              value={msg}
              onChange={(e) => {
                setMsg(e.target.value);
              }}
              placeholder="Type here"
              size="large"
            />
            <Button
              onClick={handleSend}
              disabled={!msg}
              size="large"
              icon={<SendOutlined />}
              type="primary"
            >
              Send
            </Button>
          </Space.Compact>
        </div>
      </div>
    </div>
  );
};

export default Home;
