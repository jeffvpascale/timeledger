using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeLedger.Api.Data;
using TimeLedger.Api.Data.Dtos;
using TimeLedger.Api.Data.Entities;

namespace TimeLedger.Api.Controllers
{
	[ApiController]
	[Route("api/client")]
	public class ClientController : ControllerBase
	{
		private readonly TimeLedgerDbContext _db;

		public ClientController(TimeLedgerDbContext db)
		{
			_db = db;
		}

		[HttpGet]
		public async Task<ActionResult<IEnumerable<ClientResponseDto>>> GetAllClientsAsync()
		{
			List<ClientResponseDto> responseDtos = await _db.Clients
				.AsNoTracking()
				.Select(client => new ClientResponseDto
				{
					Id = client.Id,
					Name = client.Name,
					IsArchived = client.IsArchived
				})
				.OrderBy(c => c.Name)
				.ToListAsync();

			return Ok(responseDtos);
		}
		[HttpGet("{id:int}", Name = nameof(GetClientByIdAsync))]
		public async Task<ActionResult<ClientResponseDto>> GetClientByIdAsync(int id)
		{
			var responseDto = await _db.Clients
				.AsNoTracking()
				.Where(c => c.Id == id)
				.Select(c => new ClientResponseDto
				{
					Id = c.Id,
					Name = c.Name,
					IsArchived = c.IsArchived
				})
				.FirstOrDefaultAsync();

			if (responseDto == null)
			{
				return NotFound();
			}

			return Ok(responseDto);
		}

		[HttpPost]
		public async Task<ActionResult<ClientResponseDto>> CreateClientAsync([FromBody] ClientCreateDto clientDto)
		{
			var trimmedClientName = clientDto.Name.Trim();
			Client newClient = new Client
			{
				Name = trimmedClientName,
				IsArchived = false
			};

			var duplicateExists = await _db.Clients.AnyAsync(c =>
				c.Name.Trim() == trimmedClientName);

			if (duplicateExists)
			{
				return BadRequest(new
				{
					message = "Please enter a unique client name."
				});
			}

			_db.Add(newClient);
			await _db.SaveChangesAsync();

			var responseDto = new ClientResponseDto
			{
				Id = newClient.Id,
				Name = newClient.Name,
				IsArchived = newClient.IsArchived
			};

			return CreatedAtRoute(
				nameof(GetClientByIdAsync),
				new { id = responseDto.Id },
				responseDto
			);
		}

		[HttpPut("{id:int}")]
		public async Task<ActionResult<ClientResponseDto>> UpdateClientAsync(int id, [FromBody] ClientUpdateDto clientDto)
		{
			var trimmedClientName = clientDto.Name.Trim();
			var updateClient = await _db.Clients.FirstOrDefaultAsync(c => c.Id == id);
			if (updateClient == null)
			{
				return NotFound();
			}
			var duplicateExists = await _db.Clients.AnyAsync(c =>
				c.Id != id &&
				c.Name.Trim() == trimmedClientName);

			if (duplicateExists)
			{
				return BadRequest(new
				{
					message = "Please enter a unique client name."
				});
			}

			updateClient.Name = trimmedClientName;
			updateClient.IsArchived = clientDto.IsArchived;

			await _db.SaveChangesAsync();

			ClientResponseDto responseDto = new()
			{
				Id = updateClient.Id,
				Name = updateClient.Name,
				IsArchived = updateClient.IsArchived,
			};

			return Ok(responseDto);
		}
	}
}
