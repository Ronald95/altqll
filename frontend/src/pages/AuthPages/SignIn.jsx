import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Iniciar sesión - NavalSys"
        description="Accede a tu cuenta para disfrutar de todas las funcionalidades de nuestra plataforma."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
