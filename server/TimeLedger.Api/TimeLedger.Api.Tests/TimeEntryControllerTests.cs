using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeLedger.Api.Controllers;
using TimeLedger.Api.Data.Dtos;
using TimeLedger.Api.Data.Entities;
using TimeLedger.Api.Tests.TestSupport;

namespace TimeLedger.Api.Tests
{
	public class TimeEntryControllerTests
	{
		[Fact]
		public async Task GetTimeEntriesByProjectId_ReturnsOnlyProjectsEntriesInDateOrder()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);
			var project = await TestData.SeedProjectAsync(
				db,
				clientId: client.Id);
			var otherProject = await TestData.SeedProjectAsync(
				db,
				name: "Internal Dashboard",
				clientId: client.Id);

			var firstEntry = new TimeEntry
			{
				Date = new DateOnly(2026, 11, 3),
				Description = "Initial planning",
				TimeSpent = 2m,
				BillingStatus = BillingStatus.Unbilled,
				ProjectId = project.Id,
			};

			var secondEntry = new TimeEntry
			{
				Date = new DateOnly(2026, 11, 1),
				Description = "Project setup",
				TimeSpent = 1.5m,
				BillingStatus = BillingStatus.Billed,
				ProjectId = project.Id,
			};

			var otherProjectEntry = new TimeEntry
			{
				Date = new DateOnly(2026, 11, 2),
				Description = "Dashboard work",
				TimeSpent = 3m,
				BillingStatus = BillingStatus.NonBillable,
				ProjectId = otherProject.Id,
			};

			db.TimeEntries.AddRange(firstEntry, secondEntry, otherProjectEntry);
			await db.SaveChangesAsync();

			var controller = new TimeEntryController(db);

			// Act
			var result = await controller.GetTimeEntriesByProjectIdAsync(project.Id);

			// Assert
			var ok = Assert.IsType<OkObjectResult>(result.Result);
			var response = Assert.IsAssignableFrom<IEnumerable<TimeEntryResponseDto>>(ok.Value);

			Assert.Equal(
				new[]
				{
					(secondEntry.Id, new DateOnly(2026, 11, 1), "Project setup", 1.5m, BillingStatus.Billed),
					(firstEntry.Id, new DateOnly(2026, 11, 3), "Initial planning", 2m, BillingStatus.Unbilled),
				},
				response.Select(entry => (
					entry.Id,
					entry.Date,
					entry.Description,
					entry.TimeSpent,
					entry.BillingStatus)));
		}

		[Theory]
		[InlineData(1, "Initial planning", 2, BillingStatus.Unbilled)]
		[InlineData(2, "Project setup", 1.5, BillingStatus.Billed)]
		[InlineData(3, "Internal review", 0.5, BillingStatus.NonBillable)]
		public async Task GetTimeEntryById_ReturnsRequestedTimeEntry(
			int timeEntryId,
			string description,
			decimal timeSpent,
			BillingStatus billingStatus)
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);
			var project = await TestData.SeedProjectAsync(
				db,
				clientId: client.Id);

			var entry = new TimeEntry
			{
				Id = timeEntryId,
				Date = new DateOnly(2026, 11, 4),
				Description = description,
				TimeSpent = timeSpent,
				BillingStatus = billingStatus,
				ProjectId = project.Id,
			};

			db.TimeEntries.Add(entry);
			await db.SaveChangesAsync();

			var controller = new TimeEntryController(db);

			// Act
			var result = await controller.GetTimeEntryByIdAsync(project.Id, timeEntryId);

			// Assert
			var ok = Assert.IsType<OkObjectResult>(result.Result);
			var response = Assert.IsType<TimeEntryResponseDto>(ok.Value);

			Assert.Equal(timeEntryId, response.Id);
			Assert.Equal(new DateOnly(2026, 11, 4), response.Date);
			Assert.Equal(description, response.Description);
			Assert.Equal(timeSpent, response.TimeSpent);
			Assert.Equal(billingStatus, response.BillingStatus);
		}

		[Fact]
		public async Task GetTimeEntryById_WhenTimeEntryDoesNotExist_ReturnsNotFound()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);
			var project = await TestData.SeedProjectAsync(
				db,
				clientId: client.Id);
			var controller = new TimeEntryController(db);

			// Act
			var result = await controller.GetTimeEntryByIdAsync(project.Id, 999);

			// Assert
			Assert.IsType<NotFoundResult>(result.Result);
		}

		[Fact]
		public async Task GetTimeEntryById_WhenTimeEntryBelongsToAnotherProject_ReturnsNotFound()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);
			var firstProject = await TestData.SeedProjectAsync(
				db,
				clientId: client.Id);
			var secondProject = await TestData.SeedProjectAsync(
				db,
				name: "Internal Dashboard",
				clientId: client.Id);

			var entry = new TimeEntry
			{
				Date = new DateOnly(2026, 11, 4),
				Description = "Initial planning",
				TimeSpent = 2m,
				ProjectId = firstProject.Id,
			};

			db.TimeEntries.Add(entry);
			await db.SaveChangesAsync();

			var controller = new TimeEntryController(db);

			// Act
			var result = await controller.GetTimeEntryByIdAsync(secondProject.Id, entry.Id);

			// Assert
			Assert.IsType<NotFoundResult>(result.Result);
		}

		[Fact]
		public async Task CreateTimeEntry_SavesTimeEntry()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);
			var project = await TestData.SeedProjectAsync(
				db,
				clientId: client.Id);

			var request = new TimeEntryCreateDto
			{
				Date = new DateOnly(2026, 11, 4),
				Description = "Initial planning",
				TimeSpent = 2m,
				BillingStatus = BillingStatus.Unbilled,
				ProjectId = project.Id,
			};

			var controller = new TimeEntryController(db);

			// Act
			var result = await controller.CreateTimeEntryAsync(request);

			// Assert
			var created = Assert.IsType<CreatedAtRouteResult>(result.Result);
			var response = Assert.IsType<TimeEntryResponseDto>(created.Value);

			Assert.Equal(new DateOnly(2026, 11, 4), response.Date);
			Assert.Equal("Initial planning", response.Description);
			Assert.Equal(2m, response.TimeSpent);
			Assert.Equal(BillingStatus.Unbilled, response.BillingStatus);
			Assert.True(response.Id > 0);

			db.ChangeTracker.Clear();

			var savedEntry = await db.TimeEntries.SingleAsync();

			Assert.Equal(response.Id, savedEntry.Id);
			Assert.Equal(new DateOnly(2026, 11, 4), savedEntry.Date);
			Assert.Equal("Initial planning", savedEntry.Description);
			Assert.Equal(2m, savedEntry.TimeSpent);
			Assert.Equal(BillingStatus.Unbilled, savedEntry.BillingStatus);
			Assert.Equal(project.Id, savedEntry.ProjectId);
		}

		[Fact]
		public async Task CreateTimeEntry_WhenDateIsMissing_ReturnsBadRequest()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);
			var project = await TestData.SeedProjectAsync(
				db,
				clientId: client.Id);

			var request = new TimeEntryCreateDto
			{
				Description = "Initial planning",
				TimeSpent = 2m,
				ProjectId = project.Id,
			};

			var controller = new TimeEntryController(db);

			// Act
			var result = await controller.CreateTimeEntryAsync(request);

			// Assert
			var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
			Assert.Equal("A date is required.", badRequest.Value);
		}

		[Fact]
		public async Task CreateTimeEntry_WhenProjectDoesNotExist_ReturnsNotFound()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var request = new TimeEntryCreateDto
			{
				Date = new DateOnly(2026, 11, 4),
				Description = "Initial planning",
				TimeSpent = 2m,
				ProjectId = 999,
			};

			var controller = new TimeEntryController(db);

			// Act
			var result = await controller.CreateTimeEntryAsync(request);

			// Assert
			Assert.IsType<NotFoundResult>(result.Result);
		}

		[Fact]
		public async Task UpdateTimeEntry_SavesChanges()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);
			var project = await TestData.SeedProjectAsync(
				db,
				clientId: client.Id);

			var entry = new TimeEntry
			{
				Date = new DateOnly(2026, 11, 3),
				Description = "Initial planning",
				TimeSpent = 2m,
				BillingStatus = BillingStatus.Unbilled,
				ProjectId = project.Id,
			};

			db.TimeEntries.Add(entry);
			await db.SaveChangesAsync();

			var request = new TimeEntryUpdateDto
			{
				Date = new DateOnly(2026, 11, 4),
				Description = "Client meeting",
				TimeSpent = 1.5m,
				BillingStatus = BillingStatus.Billed,
			};

			var controller = new TimeEntryController(db);

			// Act
			var result = await controller.UpdateTimeEntryAsync(entry.Id, request);

			// Assert
			var ok = Assert.IsType<OkObjectResult>(result.Result);
			var response = Assert.IsType<TimeEntryResponseDto>(ok.Value);

			Assert.Equal(entry.Id, response.Id);
			Assert.Equal(new DateOnly(2026, 11, 4), response.Date);
			Assert.Equal("Client meeting", response.Description);
			Assert.Equal(1.5m, response.TimeSpent);
			Assert.Equal(BillingStatus.Billed, response.BillingStatus);

			db.ChangeTracker.Clear();

			var savedEntry = await db.TimeEntries.SingleAsync();

			Assert.Equal(new DateOnly(2026, 11, 4), savedEntry.Date);
			Assert.Equal("Client meeting", savedEntry.Description);
			Assert.Equal(1.5m, savedEntry.TimeSpent);
			Assert.Equal(BillingStatus.Billed, savedEntry.BillingStatus);
		}

		[Fact]
		public async Task UpdateTimeEntry_WhenDateIsMissing_ReturnsBadRequest()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);
			var project = await TestData.SeedProjectAsync(
				db,
				clientId: client.Id);

			var entry = new TimeEntry
			{
				Date = new DateOnly(2026, 11, 3),
				Description = "Initial planning",
				TimeSpent = 2m,
				ProjectId = project.Id,
			};

			db.TimeEntries.Add(entry);
			await db.SaveChangesAsync();

			var request = new TimeEntryUpdateDto
			{
				Description = "Client meeting",
				TimeSpent = 1.5m,
				BillingStatus = BillingStatus.Billed,
			};

			var controller = new TimeEntryController(db);

			// Act
			var result = await controller.UpdateTimeEntryAsync(entry.Id, request);

			// Assert
			var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
			Assert.Equal("A date is required.", badRequest.Value);
		}

		[Fact]
		public async Task UpdateTimeEntry_WhenTimeEntryDoesNotExist_ReturnsNotFound()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var request = new TimeEntryUpdateDto
			{
				Date = new DateOnly(2026, 11, 4),
				Description = "Client meeting",
				TimeSpent = 1.5m,
				BillingStatus = BillingStatus.Billed,
			};

			var controller = new TimeEntryController(db);

			// Act
			var result = await controller.UpdateTimeEntryAsync(999, request);

			// Assert
			Assert.IsType<NotFoundResult>(result.Result);
		}

		[Fact]
		public async Task UpdateBillingStatus_SavesBillingStatus()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);
			var project = await TestData.SeedProjectAsync(
				db,
				clientId: client.Id);

			var entry = new TimeEntry
			{
				Date = new DateOnly(2026, 11, 4),
				Description = "Initial planning",
				TimeSpent = 2m,
				BillingStatus = BillingStatus.Unbilled,
				ProjectId = project.Id,
			};

			db.TimeEntries.Add(entry);
			await db.SaveChangesAsync();

			var controller = new TimeEntryController(db);

			// Act
			var result = await controller.UpdateBillingStatus(
				entry.Id,
				BillingStatus.Billed);

			// Assert
			var ok = Assert.IsType<OkObjectResult>(result.Result);
			var response = Assert.IsType<TimeEntryResponseDto>(ok.Value);

			Assert.Equal(BillingStatus.Billed, response.BillingStatus);

			db.ChangeTracker.Clear();

			var savedEntry = await db.TimeEntries.SingleAsync();

			Assert.Equal(BillingStatus.Billed, savedEntry.BillingStatus);
		}

		[Fact]
		public async Task UpdateBillingStatus_WhenTimeEntryDoesNotExist_ReturnsNotFound()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;
			var controller = new TimeEntryController(db);

			// Act
			var result = await controller.UpdateBillingStatus(
				999,
				BillingStatus.Billed);

			// Assert
			Assert.IsType<NotFoundResult>(result.Result);
		}

		[Fact]
		public async Task DeleteTimeEntry_RemovesTimeEntry()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var db = database.Db;

			var client = await TestData.SeedClientAsync(db);
			var project = await TestData.SeedProjectAsync(
				db,
				clientId: client.Id);

			var entry = new TimeEntry
			{
				Date = new DateOnly(2026, 11, 4),
				Description = "Initial planning",
				TimeSpent = 2m,
				ProjectId = project.Id,
			};

			db.TimeEntries.Add(entry);
			await db.SaveChangesAsync();

			var controller = new TimeEntryController(db);

			// Act
			var result = await controller.DeleteTimeEntryAsync(entry.Id);

			// Assert
			Assert.IsType<NoContentResult>(result);
			Assert.Empty(await db.TimeEntries.ToListAsync());
		}

		[Fact]
		public async Task DeleteTimeEntry_WhenTimeEntryDoesNotExist_ReturnsNotFound()
		{
			// Arrange
			await using var database = await TestDatabase.CreateAsync();
			var controller = new TimeEntryController(database.Db);

			// Act
			var result = await controller.DeleteTimeEntryAsync(999);

			// Assert
			Assert.IsType<NotFoundResult>(result);
		}
	}
}
