import { apiSlice } from './apiSlice';

// Auth API Endpoints
export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Login Mutation
    login: builder.mutation({
      query: (credentials) => ({
        url: '/login.php',
        method: 'POST',
        body: credentials, // { kullaniciadi, sifre }
      }),
      transformResponse: (response) => {
        // API'den gelen response'u transform et
        if (response.success) {
          return {
            accessToken: response.data.accessToken,
          };
        }
        throw new Error(response.message || 'Login başarısız');
      },
    }),

    // Logout Mutation
    logout: builder.mutation({
      query: () => ({
        url: '/logout.php',
        method: 'POST',
      }),
      transformResponse: (response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Logout başarısız');
      },
    }),

    // Refresh Token Mutation
    refreshToken: builder.mutation({
      query: () => ({
        url: '/refresh-token.php',
        method: 'POST',
      }),
      transformResponse: (response) => {
        if (response.success) {
          return {
            accessToken: response.data.accessToken,
          };
        }
        throw new Error(response.message || 'Token yenilenemedi');
      },
    }),

    // Profile Query - Token gerektirir
    getProfile: builder.query({
      query: () => '/profile.php',
      transformResponse: (response) => {
        if (response.success) {
          return response.data.kullanici;
        }
        throw new Error(response.message || 'Profil alınamadı');
      },
      providesTags: ['Profile'], // Cache için tag
    }),
  }),
});

// Auto-generated hooks
export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetProfileQuery,
} = authApi;
