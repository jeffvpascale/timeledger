using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeLedger.Api.Controllers;
using TimeLedger.Api.Data.Dtos;
using TimeLedger.Api.Data.Entities;
using TimeLedger.Api.Tests.TestSupport;

namespace TimeLedger.Api.Tests
{
	public class ProjectControllerTests
	{
		[Fact]
		public async Task GetProjectsByClientId_ReturnsOnlyClientsProjectsInNameOrder()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);

			var project1 = new Project
			{
				Name = "Website Redesign",
				Description = "Redesign and development of company website",
				Rate = 100m,
				IsArchived = false,
				ClientId = client.Id,
			};

			var project2 = new Project
			{
				Name = "Internal Dashboard",
				Description = "Reporting dashboard development",
				Rate = 125m,
				IsArchived = false,
				ClientId = client.Id,
			};

			var otherClient = await TestData.SeedClientAsync(
				db,
				name: "Other Client");

			var otherClientProject = new Project
			{
				Name = "Other Client Project",
				Rate = 75m,
				ClientId = otherClient.Id,
			};

			db.Projects.AddRange(project1, project2, otherClientProject);
			await db.SaveChangesAsync();

			var controller = new ProjectController(db);

			var result = await controller.GetProjectsByClientIdAsync(client.Id);

			// Assert: the response contains the client's projects in name order.
			var ok = Assert.IsType<OkObjectResult>(result.Result);
			var response = Assert.IsAssignableFrom<IEnumerable<ProjectResponseDto>>(ok.Value);

			Assert.Equal(
			new[]
			{
				(project2.Id, "Internal Dashboard", (string?)"Reporting dashboard development", 125m, false),
				(project1.Id, "Website Redesign", (string?)"Redesign and development of company website", 100m, false),
			},
			response.Select(p => (p.Id, p.Name, p.Description, p.Rate, p.IsArchived)));
		}

		[Theory]
		[InlineData(1, "Website Redesign", "Redesign and development of company website", 100, false)]
		[InlineData(2, "Internal Dashboard", "Reporting dashboard development", 150, false)]
		[InlineData(3, "Internal Dashboard", null, 125, false)]
		public async Task GetProjectById_ReturnsRequestedProject(
			int projectId,
			string name,
			string? description,
			decimal rate,
			bool isArchived)
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);

			var project = new Project
			{
				Id = projectId,
				Name = name,
				Description = description,
				Rate = rate,
				IsArchived = isArchived,
				ClientId = client.Id,
			};


			db.Projects.Add(project);
			await db.SaveChangesAsync();

			var controller = new ProjectController(db);

			var result = await controller.GetProjectByIdAsync(client.Id, projectId);

			// Assert: the response contains the requested project.
			var ok = Assert.IsType<OkObjectResult>(result.Result);
			var response = Assert.IsType<ProjectResponseDto>(ok.Value);

			Assert.Equal(projectId, response.Id);
			Assert.Equal(name, response.Name);
			Assert.Equal(description, response.Description);
			Assert.Equal(rate, response.Rate);
			Assert.Equal(isArchived, response.IsArchived);
		}

		[Fact]
		public async Task GetProjectById_WhenProjectDoesNotExist_ReturnsNotFound()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);

			var controller = new ProjectController(db);

			var result = await controller.GetProjectByIdAsync(client.Id, 999);

			Assert.IsType<NotFoundResult>(result.Result);
		}

		[Fact]
		public async Task GetProjectById_WhenProjectBelongsToAnotherClient_ReturnsNotFound()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var firstClient = await TestData.SeedClientAsync(db);
			var secondClient = await TestData.SeedClientAsync(
				db,
				name: "Second Client");

			var project = new Project
			{
				Name = "Website Redesign",
				Rate = 100m,
				ClientId = firstClient.Id,
			};

			db.Projects.Add(project);
			await db.SaveChangesAsync();

			var controller = new ProjectController(db);

			// Act
			var result = await controller.GetProjectByIdAsync(
				secondClient.Id,
				project.Id);

			// Assert
			Assert.IsType<NotFoundResult>(result.Result);
		}

		[Fact]
		public async Task CreateProject_TrimsFieldsAndSavesProject()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);

			var request = new ProjectCreateDto
			{
				Name = "     Website Redesign     ",
				Description = "   Redesign and development of company website   ",
				Rate = 100m,
				ClientId = client.Id,
			};

			var controller = new ProjectController(db);

			var result = await controller.CreateProjectAsync(request);

			// Assert: the response represents a newly created project.
			var created = Assert.IsType<CreatedAtRouteResult>(result.Result);
			var response = Assert.IsType<ProjectResponseDto>(created.Value);

			Assert.Equal("Website Redesign", response.Name);
			Assert.Equal("Redesign and development of company website", response.Description);
			Assert.Equal(100m, response.Rate);
			Assert.False(response.IsArchived);
			Assert.True(response.Id > 0);

			// Read the database again to verify what was actually saved.
			db.ChangeTracker.Clear();

			var savedProject = await db.Projects.SingleAsync();

			Assert.Equal(response.Id, savedProject.Id);
			Assert.Equal("Website Redesign", savedProject.Name);
			Assert.Equal("Redesign and development of company website", savedProject.Description);
			Assert.Equal(100m, savedProject.Rate);
			Assert.False(savedProject.IsArchived);
		}

		[Fact]
		public async Task CreateProject_WhenClientDoesNotExist_ReturnsNotFound()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var request = new ProjectCreateDto
			{
				Name = "     Website Redesign     ",
				Description = "   Redesign and development of company website   ",
				Rate = 100m,
				ClientId = 999,
			};

			var controller = new ProjectController(db);

			var result = await controller.CreateProjectAsync(request);

			// Assert: creation is rejected because the client does not exist.
			Assert.IsType<NotFoundResult>(result.Result);
		}

		[Fact]
		public async Task CreateProject_WhenNameAlreadyExistsForClient_ReturnsBadRequest()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);

			db.Projects.Add(new Project
			{
				Name = "Website Redesign",
				Rate = 100m,
				ClientId = client.Id,
			});
			await db.SaveChangesAsync();

			var request = new ProjectCreateDto
			{
				Name = "  Website Redesign  ",
				Rate = 100m,
				ClientId = client.Id,
			};

			var controller = new ProjectController(db);
			var result = await controller.CreateProjectAsync(request);

			// Assert
			var badRequest =
				Assert.IsType<BadRequestObjectResult>(result.Result);

			var body = System.Text.Json.JsonSerializer.SerializeToElement(
				badRequest.Value);

			Assert.Equal(
				"Please enter a unique project name.",
				body.GetProperty("message").GetString());

			Assert.Equal(1, await db.Projects.CountAsync());
		}

		[Fact]
		public async Task CreateProject_WhenNameExistsForAnotherClient_CreatesProject()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var firstClient = await TestData.SeedClientAsync(db);
			var secondClient = await TestData.SeedClientAsync(
				db,
				name: "Second Client");

			db.Projects.Add(new Project
			{
				Name = "Website Redesign",
				Rate = 100m,
				ClientId = firstClient.Id,
			});
			await db.SaveChangesAsync();

			var request = new ProjectCreateDto
			{
				Name = "Website Redesign",
				Rate = 100m,
				ClientId = secondClient.Id,
			};

			var controller = new ProjectController(db);

			// Act
			var result = await controller.CreateProjectAsync(request);

			// Assert
			var created = Assert.IsType<CreatedAtRouteResult>(result.Result);
			var response = Assert.IsType<ProjectResponseDto>(created.Value);

			Assert.Equal("Website Redesign", response.Name);
			Assert.Equal(2, await db.Projects.CountAsync());
		}

		[Fact]
		public async Task UpdateProject_TrimsFieldsAndSavesProject()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);

			var project = new Project
			{
				Id = 1,
				Name = "Website Redesign",
				Rate = 100m,
				ClientId = client.Id,
			};

			db.Projects.Add(project);
			await db.SaveChangesAsync();

			var request = new ProjectUpdateDto
			{
				Name = "  Website Update  ",
				Description = "  Redesign and development of company website  ",
				Rate = 125m,
				IsArchived = true
			};

			var controller = new ProjectController(db);

			var result = await controller.UpdateProjectAsync(project.Id, request);

			// Assert: the response contains the updated project.
			var ok = Assert.IsType<OkObjectResult>(result.Result);
			var response = Assert.IsType<ProjectResponseDto>(ok.Value);

			Assert.Equal("Website Update", response.Name);
			Assert.Equal("Redesign and development of company website", response.Description);
			Assert.Equal(125m, response.Rate);
			Assert.True(response.IsArchived);
			Assert.Equal(project.Id, response.Id);

			// Read the database again to verify what was actually saved.
			db.ChangeTracker.Clear();

			var savedProject = await db.Projects.SingleAsync();

			Assert.Equal(response.Id, savedProject.Id);
			Assert.Equal("Website Update", savedProject.Name);
			Assert.Equal("Redesign and development of company website", savedProject.Description);
			Assert.Equal(125m, savedProject.Rate);
			Assert.True(savedProject.IsArchived);
		}

		[Fact]
		public async Task UpdateProject_WhenNameIsUnchanged_UpdatesProject()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);

			var project = new Project
			{
				Name = "Website Redesign",
				Rate = 100m,
				IsArchived = false,
				ClientId = client.Id,
			};

			db.Projects.Add(project);
			await db.SaveChangesAsync();

			var request = new ProjectUpdateDto
			{
				Name = "Website Redesign",
				Rate = 100m,
				IsArchived = true,
			};

			var controller = new ProjectController(db);

			// Act
			var result = await controller.UpdateProjectAsync(project.Id, request);

			// Assert
			var ok = Assert.IsType<OkObjectResult>(result.Result);
			var response = Assert.IsType<ProjectResponseDto>(ok.Value);

			Assert.Equal("Website Redesign", response.Name);
			Assert.True(response.IsArchived);
		}

		[Fact]
		public async Task UpdateProject_WhenNameAlreadyExistsForClient_ReturnsBadRequest()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);

			var firstProject = new Project
			{
				Name = "Website Redesign",
				Rate = 100m,
				ClientId = client.Id,
			};

			var secondProject = new Project
			{
				Name = "Internal Dashboard",
				Rate = 125m,
				ClientId = client.Id,
			};

			db.Projects.AddRange(firstProject, secondProject);
			await db.SaveChangesAsync();

			var request = new ProjectUpdateDto
			{
				Name = "  Website Redesign  ",
				Rate = 125m,
				IsArchived = false,
			};

			var controller = new ProjectController(db);

			// Act
			var result = await controller.UpdateProjectAsync(secondProject.Id, request);

			// Assert
			var badRequest =
				Assert.IsType<BadRequestObjectResult>(result.Result);

			var body = System.Text.Json.JsonSerializer.SerializeToElement(
				badRequest.Value);

			Assert.Equal(
				"Please enter a unique project name.",
				body.GetProperty("message").GetString());

			db.ChangeTracker.Clear();

			var savedProject = await db.Projects.SingleAsync(
				project => project.Id == secondProject.Id);

			Assert.Equal("Internal Dashboard", savedProject.Name);
		}

		[Fact]
		public async Task UpdateProject_WhenProjectDoesNotExist_ReturnsNotFound()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var request = new ProjectUpdateDto
			{
				Name = "Website Update",
				Rate = 125m,
				IsArchived = false,
			};

			var controller = new ProjectController(db);

			// Act
			var result = await controller.UpdateProjectAsync(999, request);

			// Assert
			Assert.IsType<NotFoundResult>(result.Result);
		}
	}
}
