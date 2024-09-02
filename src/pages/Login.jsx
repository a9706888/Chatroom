import React, { useEffect, useState } from "react";
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
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { GoogleOutlined } from "@ant-design/icons";
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  Divider,
  ConfigProvider,
} from "antd";
import { useNavigate } from "react-router-dom";
import sty from "./Login.module.css";
import { message } from "antd";

const { Title } = Typography;
const Login = () => {
  const auth = getAuth(firebase);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [form] = Form.useForm();
  const onFinish = async (values) => {
    const { email, password, nickname } = values;
    setLoading(true);
    if (isLogin) {
      const q = query(
        collection(firestore, "users"),
        where("email", "==", email),
        where("password", "==", password)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        message.error("email or password wrong!");
        setLoading(false);
        return;
      }
      querySnapshot.forEach(async (d) => {
        let item = {
          ...d.data(),
          id: d.id,
        };
        console.log("item = ", item);
        message.success("Login success!");
        setLoading(false);
        window.sessionStorage.userinfo = JSON.stringify(item);
        navigate(`/`);
      });
    } else {
      try {
        const q = query(
          collection(firestore, "users"),
          where("email", "==", email)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          message.error("email have been registered!");
          setLoading(false);
          return;
        }
        let avatarBgColor = getRandomDarkColor();
        const resData = await addDoc(collection(firestore, "users"), {
          email,
          nickname,
          password,
          avatarBgColor,
        });
        console.log("resData id = ", resData.id);
        message.success("register success!");
        setLoading(false);
        window.sessionStorage.userinfo = JSON.stringify({
          id: resData.id,
          email,
          nickname,
          password,
          avatarBgColor,
        });
        navigate(`/`);
      } catch (err) {
        console.log("err = ", err);
        setLoading(false);
        message.error("wrong!");
      }
    }
  };
  const handleGoogleLogin = () => {
    setGLoading(true);
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(async (userCredential) => {
        // 登录成功后的处理
        setGLoading(false);
        const user = userCredential.user;
        console.log("Login success", user);
        message.success("Login success!");
        const q = query(
          collection(firestore, "users"),
          where("email", "==", user.email)
        );
        const querySnapshot = await getDocs(q);
        let userId = null;
        if (querySnapshot.empty) {
          let avatarBgColor = getRandomDarkColor();
          let resData = await addDoc(collection(firestore, "users"), {
            email: user.email,
            nickname: user.displayName,
            photoURL: user.photoURL,
            avatarBgColor
          });
          userId = resData.id;
        }else{
          querySnapshot.forEach((d) => {
            const item = {
              ...d.data(),
              id: d.id,
            };
            userId = item.id;
            console.log("userItem item666 = ", item);
          });
        }
        window.sessionStorage.userinfo = JSON.stringify({
          email: user.email,
          nickname: user.displayName,
          photoURL: user.photoURL,
          id: userId,
        });
        navigate(`/`);
      })
      .catch(() => {
        message.error("Login fail!");
        setGLoading(false);
      });
  };
  const colors1 = ["#6253E1", "rgb(255, 48, 255)"];
  const isValidEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };
  const getRandomDarkColor = () => {
    const r = Math.floor(Math.random() * 128);
    const g = Math.floor(Math.random() * 128);
    const b = Math.floor(Math.random() * 128);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        backgroundImage: "linear-gradient( 135deg, #ABDCFF 10%, #0396FF 100%)",
      }}
    >
      <div className={sty.card}>
        <div className={sty.cardCenter}>
          <div className={sty.titBox}>
            <div className={sty.block}></div>
            <Title
              style={{
                marginBottom: 2,
              }}
            >
              {isLogin ? "Login" : "Register"}
            </Title>
          </div>
          <Form
            form={form}
            name="basic"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            onFinish={onFinish}
            autoComplete="off"
          >
            {!isLogin && (
              <Form.Item
                label="Nickname"
                name="nickname"
                rules={[{ required: true, message: "Enter your nickname!" }]}
              >
                <Input />
              </Form.Item>
            )}

            <Form.Item
              label="Email"
              name="email"
              rules={[
                // { required: true, message: "请输入您的邮箱!" },
                {
                  validator: (_, value) =>
                    isValidEmail(value)
                      ? Promise.resolve()
                      : Promise.reject("wrong email format!"),
                },
              ]}
            >
              <Input placeholder="enter your email" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                {
                  required: true,
                  message: "enter your password!",
                },
              ]}
              hasFeedback
            >
              <Input.Password />
            </Form.Item>

            

            <div
              style={{
                textAlign: "center",
                marginTop: 30,
              }}
            >
              <Button
                loading={loading}
                style={{
                  width: "50%",
                }}
                type="primary"
                htmlType="submit"
              >
                {isLogin ? "Login" : "Register"}
              </Button>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 20,
              }}
            >
              <Button
                onClick={() => {
                  setIsLogin(!isLogin);
                }}
                type="link"
              >
                {isLogin ? "Don't have an account?" : "already have an account?"}
              </Button>
            </div>
          </Form>
          {isLogin && <Divider>or</Divider>}

          {isLogin && (
            <ConfigProvider
              theme={{
                components: {
                  Button: {
                    colorPrimary: `linear-gradient(135deg, ${colors1.join(
                      ", "
                    )})`,
                    colorPrimaryHover: `linear-gradient(135deg, ${colors1.join(
                      ", "
                    )})`,
                    colorPrimaryActive: `linear-gradient(135deg, ${colors1.join(
                      ", "
                    )})`,
                    lineWidth: 0,
                  },
                },
              }}
            >
              <Button
                onClick={handleGoogleLogin}
                loading={gLoading}
                type="primary"
                icon={<GoogleOutlined />}
              >
                Login with Google
              </Button>
            </ConfigProvider>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

