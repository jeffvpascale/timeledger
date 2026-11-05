using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeLedger.Api.Controllers;
using TimeLedger.Api.Data.Dtos;
using TimeLedger.Api.Data.Entities;
using TimeLedger.Api.Tests.TestSupport;

namespace TimeLedger.Api.Tests;

public class ClientControllerTests
{
	[Fact]
	public async Task GetAllClients_ReturnsClientsInNameOrder()
	{
		await using var database = await TestDatabase.CreateAsync();
		var db = database.Db;

		var acme = new Client
		{
			Name = "Acme Corporation",
			IsArchived = false
		};

		var beta = new Client
		{
			Name = "Beta Corporation",
			IsArchived = false
		};

		var gamma = new Client
		{
			Name = "Gamma Corporation",
			IsArchived = true
		};

		db.Clients.AddRange(gamma, beta, acme);
		await db.SaveChangesAsync();

		var controller = new ClientController(db);

		// Act
		var result = await controller.GetAllClientsAsync();

		// Assert: the response represents a list of clients.
		var ok = Assert.IsType<OkObjectResult>(result.Result);
		var response = Assert.IsAssignableFrom<IEnumerable<ClientResponseDto>>(ok.Value);

		Assert.Equal(
			new[]
			{
				(acme.Id, "Acme Corporation", false),
				(beta.Id, "Beta Corporation", false),
				(gamma.Id, "Gamma Corporation", true)
			},
			response.Select(c => (c.Id, c.Name, c.IsArchived)));
	}


	[Theory]
	[InlineData(1, "Acme Corporation", false)]
	[InlineData(2, "Beta Corporation", true)]
	public async Task GetClientById_ReturnsRequestedClient(
		int id,
		string name,
		bool isArchived)
	{
		await using var database = await TestDatabase.CreateAsync();
		var db = database.Db;

		var acme = new Client
		{
			Id = 1,
			Name = "Acme Corporation",
			IsArchived = false
		};

		var beta = new Client
		{
			Id = 2,
			Name = "Beta Corporation",
			IsArchived = true
		};


		db.Clients.AddRange(acme, beta);
		await db.SaveChangesAsync();

		var controller = new ClientController(db);

		// Act
		var result = await controller.GetClientByIdAsync(id);

		// Assert: the response contains the requested client.
		var ok = Assert.IsType<OkObjectResult>(result.Result);
		var response = Assert.IsType<ClientResponseDto>(ok.Value);

		Assert.Equal(id, response.Id);
		Assert.Equal(name, response.Name);
		Assert.Equal(isArchived, response.IsArchived);
	}

	[Fact]
	public async Task GetClientById_WhenClientDoesNotExist_ReturnsNotFound()
	{
		// Arrange
		await using var database = await TestDatabase.CreateAsync();
		var db = database.Db;

		var controller = new ClientController(db);

		// Act
		var result = await controller.GetClientByIdAsync(1);

		// Assert: the NotFound Response.
		Assert.IsType<NotFoundResult>(result.Result);
	}

	[Fact]
	public async Task CreateClient_TrimsNameAndSavesClient()
	{
		// Arrange
		await using var database = await TestDatabase.CreateAsync();
		var db = database.Db;

		var controller = new ClientController(db);
		var request = new ClientCreateDto
		{
			Name = "  Acme Corporation  "
		};

		// Act: call the controller.
		var result = await controller.CreateClientAsync(request);

		// Assert: the response represents a newly created client.
		var created = Assert.IsType<CreatedAtRouteResult>(result.Result);
		var response = Assert.IsType<ClientResponseDto>(created.Value);

		Assert.Equal("Acme Corporation", response.Name);
		Assert.False(response.IsArchived);
		Assert.True(response.Id > 0);

		// Read the database again to verify what was actually saved.
		db.ChangeTracker.Clear();

		var savedClient = await db.Clients.SingleAsync();

		Assert.Equal(response.Id, savedClient.Id);
		Assert.Equal("Acme Corporation", savedClient.Name);
		Assert.False(savedClient.IsArchived);
	}

	[Fact]
	public async Task CreateClient_WhenNameAlreadyExists_ReturnsBadRequest()
	{
		// Arrange
		await using var database = await TestDatabase.CreateAsync();
		var db = database.Db;

		db.Clients.Add(new Client
		{
			Name = "Acme Corporation",
			IsArchived = false
		});
		await db.SaveChangesAsync();

		var controller = new ClientController(db);
		var request = new ClientCreateDto
		{
			Name = "Acme Corporation"
		};

		// Act
		var result = await controller.CreateClientAsync(request);

		// Assert
		var badRequest =
			Assert.IsType<BadRequestObjectResult>(result.Result);

		var body = System.Text.Json.JsonSerializer.SerializeToElement(
			badRequest.Value);

		Assert.Equal(
			"Please enter a unique client name.",
			body.GetProperty("message").GetString());

		Assert.Equal(1, await db.Clients.CountAsync());
	}

	[Fact]
	public async Task UpdateClient_WhenNameAlreadyExists_ReturnsBadRequest()
	{
		// Arrange
		await using var database = await TestDatabase.CreateAsync();
		var db = database.Db;

		db.Clients.Add(new Client
		{
			Id = 1,
			Name = "Acme Corporation",
			IsArchived = false
		});
		db.Clients.Add(new Client
		{
			Id = 2,
			Name = "Beta Corporation",
			IsArchived = false
		});
		await db.SaveChangesAsync();

		var controller = new ClientController(db);
		var request = new ClientUpdateDto
		{
			Name = "Acme Corporation",
			IsArchived = false
		};

		// Act
		var result = await controller.UpdateClientAsync(2, request);

		// Assert
		var badRequest =
			Assert.IsType<BadRequestObjectResult>(result.Result);

		var body = System.Text.Json.JsonSerializer.SerializeToElement(
			badRequest.Value);

		Assert.Equal(
			"Please enter a unique client name.",
			body.GetProperty("message").GetString());

		db.ChangeTracker.Clear();

		var savedClient = await db.Clients.SingleAsync(c => c.Id == 2);

		Assert.Equal("Beta Corporation", savedClient.Name);
		Assert.False(savedClient.IsArchived);
	}

	[Theory]
	[InlineData("Updated Corporation", false)] // Rename
	[InlineData("  Beta Corporation", true)]     // Archive
	[InlineData("Updated Corporation", true)]  // Both
	public async Task UpdateClient_TrimsNameAndSavesChanges(
		string name,
		bool isArchived)
	{
		// Arrange
		await using var database = await TestDatabase.CreateAsync();
		var db = database.Db;

		var client = new Client
		{
			Name = "Beta Corporation",
			IsArchived = false
		};

		db.Clients.Add(client);
		await db.SaveChangesAsync();

		var controller = new ClientController(db);
		var request = new ClientUpdateDto
		{
			Name = name,
			IsArchived = isArchived
		};

		// Act
		var result = await controller.UpdateClientAsync(client.Id, request);

		// Assert: the response represents a updated client.
		var ok = Assert.IsType<OkObjectResult>(result.Result);
		var response = Assert.IsType<ClientResponseDto>(ok.Value);

		db.ChangeTracker.Clear();

		var savedClient = await db.Clients.SingleAsync(c => c.Id == client.Id);

		Assert.Equal(client.Id, response.Id);
		Assert.Equal(name.Trim(), savedClient.Name);
		Assert.Equal(isArchived, savedClient.IsArchived);
	}

}
