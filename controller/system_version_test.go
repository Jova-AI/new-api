package controller

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestPublicStatusOmitsVersion(t *testing.T) {
	for _, role := range []int{0, common.RoleCommonUser, common.RoleAdminUser, common.RoleRootUser} {
		recorder := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(recorder)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/status", nil)
		c.Set("role", role)
		GetStatus(c)
		require.Equal(t, http.StatusOK, recorder.Code)
		var response struct {
			Success bool                   `json:"success"`
			Data    map[string]interface{} `json:"data"`
		}
		require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
		assert.True(t, response.Success)
		assert.NotContains(t, response.Data, "version")
		assert.Contains(t, response.Data, "system_name")
	}
}

func TestSystemVersionRequiresRoot(t *testing.T) {
	previousDB, previousRedis, previousSecret := model.DB, common.RedisEnabled, common.SessionSecret
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&model.User{}, &model.UserSession{}))
	model.DB, common.RedisEnabled, common.SessionSecret = db, false, "system-version-test-secret"
	t.Cleanup(func() {
		model.DB, common.RedisEnabled, common.SessionSecret = previousDB, previousRedis, previousSecret
	})
	engine := gin.New()
	engine.GET("/api/system-info/version", middleware.RootAuth(), GetSystemVersion)
	for _, tc := range []struct {
		name       string
		role, code int
	}{
		{"anonymous", 0, http.StatusUnauthorized},
		{"user", common.RoleCommonUser, http.StatusForbidden},
		{"admin", common.RoleAdminUser, http.StatusForbidden},
		{"root", common.RoleRootUser, http.StatusOK},
	} {
		t.Run(tc.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, "/api/system-info/version", nil)
			if tc.role != 0 {
				user := &model.User{Username: "version-" + tc.name, AffCode: tc.name, Password: "unused", Role: tc.role, Status: common.UserStatusEnabled, Group: "default", AuthVersion: 1}
				require.NoError(t, db.Create(user).Error)
				session, err := service.CreateLoginSession(user.Id, "password", "127.0.0.1", "test")
				require.NoError(t, err)
				request.Header.Set("Authorization", "Bearer "+session.AccessToken)
				request.Header.Set("X-Auth-Session", session.Session.SID)
			}
			recorder := httptest.NewRecorder()
			engine.ServeHTTP(recorder, request)
			require.Equal(t, tc.code, recorder.Code, recorder.Body.String())
			var response struct {
				Success bool                   `json:"success"`
				Data    map[string]interface{} `json:"data"`
			}
			require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
			if tc.role == common.RoleRootUser {
				assert.True(t, response.Success)
				assert.Equal(t, common.Version, response.Data["version"])
			} else {
				assert.False(t, response.Success)
				assert.NotContains(t, response.Data, "version")
			}
		})
	}
}
