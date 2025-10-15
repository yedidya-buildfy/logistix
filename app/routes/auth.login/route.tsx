import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";

import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Playfair Display, serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem 4rem',
        borderRadius: '1rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '450px'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          margin: '0 0 2rem 0',
          color: '#1a202c',
          fontWeight: 400,
          textAlign: 'center'
        }}>
          Log in to Logistix
        </h1>
        <Form method="post">
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '1rem',
              color: '#4a5568',
              marginBottom: '0.5rem',
              fontWeight: 500
            }}>
              Shop domain
            </label>
            <input
              type="text"
              name="shop"
              value={shop}
              onChange={(e) => setShop(e.currentTarget.value)}
              autoComplete="on"
              placeholder="example.myshopify.com"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: errors.shop ? '2px solid #f56565' : '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
            />
            {errors.shop && (
              <p style={{
                color: '#f56565',
                fontSize: '0.875rem',
                marginTop: '0.5rem',
                margin: '0.5rem 0 0 0'
              }}>
                {errors.shop}
              </p>
            )}
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.875rem 1.5rem',
              fontSize: '1.125rem',
              fontWeight: 500,
              color: 'white',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              fontFamily: 'Playfair Display, serif'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Log in
          </button>
        </Form>
      </div>
    </div>
  );
}
